/* eslint-disable camelcase */
/* eslint-disable max-lines */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
const axios = require('axios');
const { Op } = require('sequelize');

const { REPORT_SERVER_URL, INTERNAL_SERVER_SECRET_KEY } = require('../../../config/config');
const {
  NON_PAID, WEDLANCER_ASSURED, DEFAULT_TIMEZONE, REPORT_SERVER_ROUTES: { FREELANCER_ASSIGNMENT_ROUTE },
} = require('../../../constants/service-constants');

const { sequelize, Sequelize } = require('../../../sequelize-client');
const sendEmailForFreelancerAssigned = require('../../../shared-lib/emails/event/send-email-for-freelancer-assigned');
const sendEmailForFreelancerGotNewBooking = require('../../../shared-lib/emails/event/send-email-for-freelancer-got-new-booking');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const createNotificationForEventAssignmentToFreelancer = require('../../../shared-lib/notifications/events/create-notification-for-event-assignment-to-freelancer');
const createNotificationForFreelancerAssignmentToRecruiter = require('../../../shared-lib/notifications/events/create-notification-for-freelancer-assignment-to-recruiter');
const { getMessage } = require('../../../utils/messages');
const createTransactionForAssignFreelancerToEvent = require('../../transaction/functions/create-transaction-for-assign-freelancer-to-event');
const eventsLogger = require('../event-logger');
const eventLogger = require('../event-logger');
const getEventDaysAndOtp = require('../functions/get-event-days-and-otp');

const organicFreelancerAssignment = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      models: {
        User: UserModel, UserBusiness: UserBusinessModel, UserProfile: UserProfileModel, Event: EventModel,
        FreelancerAttendance: FreelancerAttendanceModel, EventFreelancer: EventFreelancerModel,
        EventTiming: EventTimingsModel, FreelancerCalender: FreelancerCalenderModel,
      },
      localeService,
    } = ctx;
    const { req: { user } } = ctx;
    const { freelancerId, finalizedPrice, timeZone = DEFAULT_TIMEZONE } = args.data;
    const { eventId, id } = args.where;

    const eventInstance = await EventModel.findByPk(eventId);

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    const eventFreelancerInstance = await UserProfileModel.findOne({ where: { userId: freelancerId }, attributes: ['typeKey'] });

    if (!eventFreelancerInstance) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }

    const recruiterInstance = await UserModel.findOne({
      where: {
        id: eventInstance.recruiterId,
      },
      attributes: ['id'],
      include: [
        {
          model: UserProfileModel,
          as: 'profile',
          attributes: ['typeKey'],
        },
        {
          model: UserBusinessModel,
          as: 'business',
          attributes: ['totalBalance'],
        },
      ],
    });

    if (!recruiterInstance) {
      throw new CustomApolloError(getMessage('RECRUITER_NOT_FOUND', localeService));
    }

    const existingEventFreelancer = await EventFreelancerModel.findOne({ where: { eventId, userId: freelancerId, isAssigned: true } });

    if (existingEventFreelancer) {
      throw new CustomApolloError(getMessage('REQUESTED_FREELANCER_ALREADY_ASSIGNED', localeService));
    }

    const eventTimings = await EventTimingsModel.findAll({ where: { eventId } });

    if (!eventTimings.length) {
      throw new CustomApolloError(getMessage('EVENT_TIMINGS_ARE_REQUIRED', localeService));
    }

    const requestedFreelancer = await EventFreelancerModel.findOne({ where: { eventId } });

    const getFreelancerCalender = await FreelancerCalenderModel.findOne({
      where: {
        userId: freelancerId,
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

    const { typeKey: freelancerType } = eventFreelancerInstance;
    const { typeKey: recruiterType } = recruiterInstance.profile;

    if (recruiterType === NON_PAID && freelancerType === WEDLANCER_ASSURED) {
      throw new CustomApolloError(getMessage('WEDLANCER_ASSURED_CAN_ONLY_BE_ASSIGNED_TO_PAID_RECRUITER', localeService));
    }
    let freelancerData;
    const eventFreelancerData = {
      finalizedPrice,
      userId: freelancerId,
      eventId,
      isAssigned: true,
    };

    if (freelancerId === requestedFreelancer.userId) {
      // update assigned status to true and finalizedPrice
      freelancerData = await EventFreelancerModel.update(eventFreelancerData, {
        where: { id },
        transaction,
        returning: true,
      });
      const [, eventFreelancers] = freelancerData;
      const [data] = eventFreelancers;
      freelancerData = data;
    } else {
      freelancerData = await EventFreelancerModel.create(eventFreelancerData, { transaction });
    }

    const calenderData = {
      userId: freelancerId,
      eventId,
      startDate: eventInstance.startDate,
      endDate: eventInstance.endDate,
    };

    if (freelancerType === WEDLANCER_ASSURED) {
      if (freelancerData) {
        // SEND NOTIFICATION TO THE FREELANCER AND RECRUITER
        createNotificationForFreelancerAssignmentToRecruiter(user.id, eventInstance, freelancerId, localeService);
        createNotificationForEventAssignmentToFreelancer(user.id, eventInstance, freelancerId, localeService);

        // GET NUMBER OF TOTAL DAYS AND GENERATEOTP FOR EACH DAY
        const { totalDays, generateOtpData } = await getEventDaysAndOtp(eventId, eventTimings, timeZone, freelancerId, ctx);

        await FreelancerAttendanceModel.bulkCreate(generateOtpData, { transaction });
        await FreelancerCalenderModel.create(calenderData, { transaction });
        await createTransactionForAssignFreelancerToEvent(freelancerId, eventId, transaction, totalDays, ctx);
      }
    }

    await transaction.commit();

    // SEND EMAIL TO FREELANCER
    sendEmailForFreelancerGotNewBooking(eventId, freelancerId);
    if (freelancerType === WEDLANCER_ASSURED && freelancerData) {
      try {
        await axios.post(`${REPORT_SERVER_URL}${FREELANCER_ASSIGNMENT_ROUTE}`, {
          eventId,
          freelancerId,
        }, { headers: { internal_server_secret: INTERNAL_SERVER_SECRET_KEY } });

        // SEND EMAIL TO RECRUITER FOR FREELANCER ASSIGNED
        sendEmailForFreelancerAssigned(eventId, freelancerId);
      } catch (error) {
        eventLogger(`Error while generating freelancer assignment invoice : ${error}`, ctx, 'error');
      }
    }

    const response = {
      status: 'SUCCESS',
      message: getMessage('FREELANCER_ASSIGNED_SUCCESSFULLY', localeService),
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventsLogger(`Error assigning freelancer to organic: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = organicFreelancerAssignment;
