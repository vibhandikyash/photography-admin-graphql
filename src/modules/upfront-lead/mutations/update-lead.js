/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { isEmpty, get } = require('lodash');
const moment = require('moment');
const Sequelize = require('sequelize');

const { WEDLANCER_ASSURED, PAID_KEY, DEFAULT_TIMEZONE } = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const createNotificationForWedlancerCoordinatorAssignment = require('../../../shared-lib/notifications/events/create-notification-for-wedlancer-coordinator-assignment');
const { getMessage } = require('../../../utils/messages');
const checkExistingCalenderDatesForEvent = require('../../event/functions/check-existing-calender-dates-for-event');
const getRequiredFreelancerDetailsForUpdateLead = require('../functions/get-required-freelancer-details-for-update-lead-data-parser');
const upfrontLeadLogger = require('../upfront-lead-logger');

const updateUpfrontLead = async (_, args, ctx) => {
  let transaction;
  try {
    const { user } = ctx.req;
    const { data = {}, where: { id } } = args;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      models: {
        Event: EventModel, UpfrontCategoryRequirement: UpfrontCategoryRequirementModel, EventTiming: EventTimingsModel, User: UserModel,
        EventFreelancer: EventFreelancerModel, UserProfile: UserProfileModel, FreelancerCalender: FreelancerCalenderModel,
      }, localeService,
    } = ctx;

    const {
      name, location, totalBudget, note, requiredFreelancer, status, wedlancerCoordinatorId, timings, startDate, endDate, timeZone = DEFAULT_TIMEZONE,
    } = data;

    const eventInstance = await EventModel.findByPk(id, {
      include: [
        {
          model: EventFreelancerModel,
          as: 'freelancers',
          where: { isAssigned: true },
          required: false,
          attributes: ['userId'],
          include: [
            {
              model: UserModel,
              as: 'eventFreelancers',
              attributes: ['id', 'fullName'],
              include: [
                {
                  model: UserProfileModel,
                  as: 'profile',
                  attributes: ['typeKey'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const { startDate: eventStartDate, endDate: eventEndDate, recruiterId } = eventInstance;

    if (moment(eventStartDate).diff(startDate, 'seconds') !== 0 || moment(eventStartDate).diff(startDate, 'seconds') !== 0) {
      // ADDED CHECK FOR EXISTING CUSTOM EVENT FOR SELECTED DATES
      const existingCustomEvent = await checkExistingCalenderDatesForEvent(recruiterId, startDate, endDate);
      if (existingCustomEvent) {
        throw new CustomApolloError(getMessage('EVENT_ALREADY_EXISTS', localeService));
      }
    }
    await FreelancerCalenderModel.update({ startDate, endDate }, { where: { eventId: id } });
    const localStartOfDay = moment().tz(timeZone).startOf('day').format(); // START OF LOCAL DAY TIMEZONE (DEFAULT ASIA/KOLKATA)
    const localEventStartDate = moment(eventStartDate).tz(timeZone).format(); // START DATE OF LOCAL TIMEZONE (DEFAULT ASIA/KOLKATA)
    const localEventEndDate = moment(eventEndDate).tz(timeZone).format(); // END DATE OF LOCAL TIMEZONE (DEFAULT ASIA/KOLKATA)

    if (isEmpty(startDate) || moment(localEventStartDate).isBefore(localStartOfDay)) {
      throw new CustomApolloError(getMessage('INVALID_START_DATE', localeService));
    }

    if (isEmpty(endDate) || moment(localEventEndDate).isBefore(localStartOfDay)) {
      throw new CustomApolloError(getMessage('INVALID_END_DATE', localeService));
    }
    // get recruiter type
    const recruiter = await UserProfileModel.findOne({ where: { userId: eventInstance.recruiterId }, attributes: ['typeKey'] });
    const dataToBeUpdated = {
      name,
      startDate: startDate || eventStartDate,
      endDate: endDate || eventEndDate,
      location,
      totalBudget,
      note,
      status,
    };
    const { freelancers = [] } = eventInstance;

    if (wedlancerCoordinatorId) {
      const wedlancerCoordinator = await UserModel.findOne({ where: { id: wedlancerCoordinatorId, role: 'WEDLANCER_COORDINATOR', accountDeletedAt: null } });
      if (!wedlancerCoordinator) {
        throw new CustomApolloError(getMessage('WEDLANCER_COORDINATOR_NOT_FOUND', localeService));
      }
      const wedlancerAssuredFreelancers = freelancers.filter(freelancer => {
        const typeKey = get(freelancer, 'eventFreelancers.profile.typeKey');
        return typeKey === WEDLANCER_ASSURED;
      });
      if (wedlancerAssuredFreelancers && wedlancerAssuredFreelancers.length > 0) {
        dataToBeUpdated.assignedTo = wedlancerCoordinatorId;
        dataToBeUpdated.isAssigned = true;

        // send notification to the freelancers and recruiters for wedlancer co-ordinator assignment
        if (recruiter?.typeKey === PAID_KEY) {
          createNotificationForWedlancerCoordinatorAssignment(user.id, eventInstance, wedlancerAssuredFreelancers, wedlancerCoordinatorId, localeService);
        }
      } else {
        throw new CustomApolloError(getMessage('WEDLANCER_COORDINATOR_CAN_BE_ASSIGNED_TO_WEDLANCER_ASSURED', localeService));
      }
    } else {
      dataToBeUpdated.assignedTo = null;
      dataToBeUpdated.isAssigned = false;
    }
    await EventModel.update(dataToBeUpdated, { where: { id }, transaction, returning: true });

    // If startDate or endDate change then create new timings
    if (moment(eventStartDate).format() !== moment(startDate).format()
      || moment(eventEndDate).format() !== moment(endDate).format()) {
      await EventTimingsModel.destroy({ where: { eventId: id } }, { transaction });
      for (const timing of timings) {
        const { startDate: timingStartDate, endDate: timingEndDate } = timing;
        const validateStartDate = moment(timingStartDate).isBetween(dataToBeUpdated.startDate, dataToBeUpdated.endDate, null, '[]');
        const validateEndDate = moment(timingEndDate).isBetween(dataToBeUpdated.startDate, dataToBeUpdated.endDate, null, '[]');

        if (!validateStartDate || !validateEndDate) { throw new CustomApolloError(getMessage('INVALID_TIMINGS', localeService)); }
        timing.eventId = id;
        await EventTimingsModel.create(timing, { transaction });
      }
    }

    if (requiredFreelancer) {
      const [requiredFreelancerDetails, sumOfRequiredFreelancer] = await getRequiredFreelancerDetailsForUpdateLead(requiredFreelancer, ctx);
      if (Number(sumOfRequiredFreelancer) !== Number(totalBudget)) {
        throw new CustomApolloError(getMessage('TOTAL_BUDGET_IS_NOT_VALID', localeService));
      }
      for (const freelancerCategory of requiredFreelancerDetails) {
        await UpfrontCategoryRequirementModel.update(freelancerCategory, {
          where: { id: freelancerCategory.id, eventId: id },
          transaction,
          returning: true,
        });
      }
    }

    await transaction.commit();
    const response = {
      message: getMessage('UPFRONT_LEAD_UPDATED_SUCCESSFULLY', localeService),
      status: 'SUCCESS',
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    upfrontLeadLogger(`Error from update lead : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateUpfrontLead;
