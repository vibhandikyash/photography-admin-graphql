/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint max-lines: ["error", {"skipBlankLines": true}] */
const axios = require('axios');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');

const { REPORT_SERVER_URL, INTERNAL_SERVER_SECRET_KEY } = require('../../../config/config');
const {
  CANCELLED, COMPLETED, ONGOING, FREELANCER, WEDLANCER_ASSURED, DEFAULT_TIMEZONE,
  REPORT_SERVER_ROUTES: { FREELANCER_ASSIGNMENT_ROUTE },
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const sendEmailForFreelancerAssigned = require('../../../shared-lib/emails/event/send-email-for-freelancer-assigned');
const sendEmailForFreelancerGotNewBooking = require('../../../shared-lib/emails/event/send-email-for-freelancer-got-new-booking');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const createNotificationForAllFreelancerAssignmentToRecruiter = require('../../../shared-lib/notifications/events/create-notification-for-all-freelancer-assignment-to-recruiter');
const createNotificationForEventAssignmentToFreelancer = require('../../../shared-lib/notifications/events/create-notification-for-event-assignment-to-freelancer');
const createNotificationForFreelancerAssignmentToRecruiter = require('../../../shared-lib/notifications/events/create-notification-for-freelancer-assignment-to-recruiter');
const { getMessage } = require('../../../utils/messages');
const createTransactionForAssignFreelancerToEvent = require('../../transaction/functions/create-transaction-for-assign-freelancer-to-event');
const eventLogger = require('../event-logger');
const getEventDaysAndOtp = require('../functions/get-event-days-and-otp');

const eventStatus = [CANCELLED, COMPLETED, ONGOING];

const assignFreelancerToEvent = async (_, args, ctx) => {
  let transaction;
  try {
    const { req, localeService } = ctx;
    const { user } = req;
    const { data } = args;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      User: UserModel, UserProfile: UserProfileModel, UpfrontCategoryRequirement: EventFreelancerCategoryModel,
      EventFreelancer: EventFreelancerModel, FreelancerCalender: FreelancerCalenderModel,
      Event: EventModel, EventTiming: EventTimingsModel,
      FreelancerAttendance: FreelancerAttendanceModel,
    } = ctx.models;

    const {
      eventId, userId, eventCategoryId, finalizedPrice, timeZone = DEFAULT_TIMEZONE,
    } = data;

    const eventInstance = await EventModel.findByPk(eventId);

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    if (eventStatus.includes(eventInstance.status)) {
      throw new CustomApolloError(getMessage('FREELANCER_ONLY_ASSIGNED_IF_STATUS_IS_UPCOMING', localeService));
    }

    const freelancerInstance = await UserModel.findOne({
      where: { id: userId, role: FREELANCER, accountDeletedAt: null },
      include: [
        {
          model: UserProfileModel,
          as: 'profile',
          attributes: ['typeKey'],
        },
      ],
    });

    if (!freelancerInstance) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }

    const eventTimings = await EventTimingsModel.findAll({ where: { eventId } });

    if (!eventTimings.length) {
      throw new CustomApolloError(getMessage('EVENT_TIMINGS_ARE_REQUIRED', localeService));
    }

    const freelancerEventCategoryInstance = await EventFreelancerCategoryModel.findOne({
      where: {
        id: eventCategoryId,
        eventId,
      },
    });

    if (!freelancerEventCategoryInstance) {
      throw new CustomApolloError(getMessage('CATEGORY_DOES_NOT_MATCH', localeService));
    }

    const assignedFreelancerToEvent = await EventFreelancerModel.count({
      where: {
        eventId,
        eventCategoryId: freelancerEventCategoryInstance.id,
        isAssigned: true,
      },
    });

    if (assignedFreelancerToEvent === freelancerEventCategoryInstance.count) {
      throw new CustomApolloError(getMessage('FREELANCER_REQUIRED_ALREADY_ASSIGNED_TO_EVENT', localeService));
    }

    const getFreelancerCalender = await FreelancerCalenderModel.findOne({
      where: {
        userId,
        startDate: {
          [Op.gte]: eventInstance.startDate,
        },
        endDate: {
          [Op.lte]: eventInstance.endDate,
        },
      },
    });

    if (getFreelancerCalender) {
      throw new CustomApolloError(getMessage('FREELANCER_ALREADY_OCCUPIED', localeService));
    }

    const checkForAlreadyAssignedFreelancer = await EventFreelancerModel.findOne({
      where: {
        eventId: eventInstance.id, userId,
      },
    });

    let assignedFreelancer;
    if (checkForAlreadyAssignedFreelancer && checkForAlreadyAssignedFreelancer.isAssigned) {
      throw new CustomApolloError(getMessage('FREELANCER_ALREADY_ASSIGNED', localeService));
    }

    if (checkForAlreadyAssignedFreelancer && checkForAlreadyAssignedFreelancer.isAssigned === false) {
      [, [assignedFreelancer]] = await EventFreelancerModel.update({
        isAssigned: true,
        finalizedPrice,
      }, {
        where: {
          eventId,
          userId,
        },
        returning: true,
      }, { transaction });
    } else {
      assignedFreelancer = await EventFreelancerModel.create({
        eventId, userId, eventCategoryId, finalizedPrice, isAssigned: true,
      }, { transaction });
    }

    // SEND NOTIFICATION WHEN ALL FREELANCERS ARE ASSIGNED
    const eventCategoryCount = await EventFreelancerCategoryModel.sum('count', { where: { eventId } });
    const assignedFreelancersCount = await EventFreelancerModel.count({ where: { eventId, isAssigned: true } });
    if (eventCategoryCount === assignedFreelancersCount) {
      createNotificationForAllFreelancerAssignmentToRecruiter(user.id, eventInstance, localeService);
    }

    const dataToBeCreatedForCalender = {
      eventId: eventInstance.id,
      userId,
      startDate: eventInstance.startDate,
      endDate: eventInstance.endDate,
      createdBy: user.id,
    };

    await FreelancerCalenderModel.create(dataToBeCreatedForCalender, { transaction });

    const { profile: { typeKey } = {} } = freelancerInstance;

    if (typeKey === WEDLANCER_ASSURED) {
      // SEND NOTIFICATION TO THE FREELANCER AND RECRUITER
      if (assignedFreelancer) {
        createNotificationForFreelancerAssignmentToRecruiter(user.id, eventInstance, assignedFreelancer.userId, localeService);
        createNotificationForEventAssignmentToFreelancer(user.id, eventInstance, assignedFreelancer.userId, localeService);

        // GET NUMBER OF TOTAL DAYS AND GENERATEOTP FOR EACH DAY
        const { totalDays, generateOtpData } = await getEventDaysAndOtp(eventId, eventTimings, timeZone, assignedFreelancer.userId, ctx);
        await FreelancerAttendanceModel.bulkCreate(generateOtpData, { transaction });
        await createTransactionForAssignFreelancerToEvent(assignedFreelancer.userId, eventInstance.id, transaction, totalDays, ctx);
      }
    }

    await transaction.commit();

    // SEND EMAIL TO FREELANCER
    sendEmailForFreelancerGotNewBooking(eventId, userId);

    if (typeKey === WEDLANCER_ASSURED && assignedFreelancer) {
      try {
        await axios.post(`${REPORT_SERVER_URL}${FREELANCER_ASSIGNMENT_ROUTE}`, {
          eventId,
          freelancerId: userId,
        }, { headers: { internal_server_secret: INTERNAL_SERVER_SECRET_KEY } });

        // SEND EMAIL TO RECRUITER FOR FREELANCER ASSIGNED
        sendEmailForFreelancerAssigned(eventId, userId);
      } catch (error) {
        eventLogger(`Error while generating freelancer assignment invoice : ${error}`, ctx, 'error');
      }
    }

    const response = {
      message: getMessage('FREELANCER_ASSIGNED_SUCCESSFULLY', localeService),
      status: 'SUCCESS',
    };

    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventLogger(`Error while assign freelancer to event : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = {
  assignFreelancerToEvent,
};
