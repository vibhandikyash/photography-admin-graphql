/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { pick, isEmpty, get } = require('lodash');
const moment = require('moment');

const {
  SUCCESS, WEDLANCER_ASSURED, WEDLANCER_COORDINATOR, SUPER_ADMIN, PAID_KEY, DEFAULT_TIMEZONE,
} = require('../../../constants/service-constants');

const { sequelize, Sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const createNotificationForWedlancerCoordinatorAssignment = require('../../../shared-lib/notifications/events/create-notification-for-wedlancer-coordinator-assignment');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');
const checkExistingCalenderDatesForEvent = require('../functions/check-existing-calender-dates-for-event');

const EVENT = ['name', 'location', 'note', 'status', 'startDate', 'endDate', 'timings'];

const updateOrganicEvent = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      models: {
        User: UserModel, UserProfile: UserProfileModel, Event: EventModel, EventTiming: EventTimingsModel, EventFreelancer: EventFreelancerModel, FreelancerCalender: FreelancerCalenderModel,
      },
      localeService,
    } = ctx;

    const { user } = ctx.req;
    const { data = {} } = args;
    const { eventId } = args.where;
    const { timeZone = DEFAULT_TIMEZONE } = data;
    const eventData = pick(data, EVENT);
    const { timings } = eventData;

    // check event
    const existingEvent = await EventModel.findByPk(eventId, {
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

    if (!existingEvent) {
      throw new CustomApolloError(getMessage('EVENT_DOES_NOT_EXIST', localeService));
    }
    const { startDate: eventStartDate, endDate: eventEndDate, recruiterId } = existingEvent;
    const { startDate, endDate } = eventData;
    // ADDED CHECK FOR EXISTING CUSTOM EVENT FOR SELECTED DATES
    if (moment(eventStartDate).diff(startDate, 'seconds') !== 0 || moment(eventStartDate).diff(startDate, 'seconds') !== 0) {
      const existingCustomEvent = await checkExistingCalenderDatesForEvent(recruiterId, startDate, endDate);
      if (existingCustomEvent) {
        throw new CustomApolloError(getMessage('EVENT_ALREADY_EXISTS', localeService));
      }
    }
    await FreelancerCalenderModel.update({ startDate, endDate }, { where: { eventId } });

    const localStartOfDay = moment().tz(timeZone).startOf('day').format(); // START OF LOCAL DAY TIMEZONE (DEFAULT ASIA/KOLKATA)
    const localEventStartDate = moment(eventStartDate).tz(timeZone).format(); // START DATE OF LOCAL TIMEZONE (DEFAULT ASIA/KOLKATA)
    const localEventEndDate = moment(eventEndDate).tz(timeZone).format(); // END DATE OF LOCAL TIMEZONE (DEFAULT ASIA/KOLKATA)

    if (isEmpty(startDate) || moment(localEventStartDate).isBefore(localStartOfDay)) {
      throw new CustomApolloError(getMessage('INVALID_START_DATE', localeService));
    }
    if (isEmpty(endDate) || moment(localEventEndDate).isBefore(localStartOfDay)) {
      throw new CustomApolloError(getMessage('INVALID_END_DATE', localeService));
    }

    const { freelancers } = existingEvent;

    // get recruiter type
    const recruiter = await UserProfileModel.findOne({ where: { userId: existingEvent.recruiterId }, attributes: ['typeKey'] });

    if (user.role === SUPER_ADMIN) {
      if (data?.assignedTo) {
        const wedlancerCoordinator = await UserModel.findOne({ where: { id: data.assignedTo, role: WEDLANCER_COORDINATOR, accountDeletedAt: null } });
        if (!wedlancerCoordinator) {
          throw new CustomApolloError(getMessage('WEDLANCER_COORDINATOR_NOT_FOUND', localeService));
        }

        const wedlancerAssuredFreelancers = freelancers.filter(freelancer => {
          const typeKey = get(freelancer, 'eventFreelancers.profile.typeKey');
          return typeKey === WEDLANCER_ASSURED;
        });
        if (wedlancerAssuredFreelancers && wedlancerAssuredFreelancers.length > 0) {
          eventData.assignedTo = data?.assignedTo;
          eventData.isAssigned = true;

          // send notification to freelancer and recruiter for W/C assignment
          if (recruiter?.typeKey === PAID_KEY) {
            createNotificationForWedlancerCoordinatorAssignment(user.id, existingEvent, wedlancerAssuredFreelancers, data.assignedTo, localeService);
          }
        } else {
          throw new CustomApolloError(getMessage('WEDLANCER_COORDINATOR_CAN_BE_ASSIGNED_TO_WEDLANCER_ASSURED', localeService));
        }
      } else {
        eventData.assignedTo = null;
        eventData.isAssigned = false;
      }
    }

    eventData.updatedBy = user.id;
    eventData.startDate = startDate || eventStartDate;
    eventData.endDate = endDate || eventEndDate;

    if (!isEmpty(eventData)) {
      await EventModel.update(eventData, { where: { id: eventId } }, { transaction });
    }

    // If startDate or endDate change then create new timings
    if (moment(eventStartDate).format() !== moment(startDate).format()
      || moment(eventEndDate).format() !== moment(endDate).format()) {
      await EventTimingsModel.destroy({ where: { eventId } }, { transaction });
      for (const timing of timings) {
        // validate date
        const { startDate: timingStartDate, endDate: timingEndDate } = timing;
        const validateStartDate = moment(timingStartDate).isBetween(startDate, endDate, null, '[]');
        const validateEndDate = moment(timingEndDate).isBetween(startDate, endDate, null, '[]');

        if (!validateStartDate || !validateEndDate) {
          throw new CustomApolloError(getMessage('INVALID_TIMINGS', localeService));
        }
        timing.eventId = eventId;
        await EventTimingsModel.create(timing, { transaction });
      }
    }

    await transaction.commit();

    const response = {
      status: SUCCESS,
      message: getMessage('ORGANIC_LEAD_UPDATED', localeService),
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventsLogger(`Error updating organic-event: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateOrganicEvent;
