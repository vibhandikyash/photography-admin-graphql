/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
const { pick, get, size } = require('lodash');
const moment = require('moment');

const {
  SUCCESS, APPROVED, DEFAULT_TIMEZONE, EVENT_NAME_LIMIT,
} = require('../../../constants/service-constants');

const { sequelize, Sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');
const checkExistingCalenderDatesForEvent = require('../functions/check-existing-calender-dates-for-event');

const EVENT = ['name', 'location', 'note', 'recruiterId'];
const EVENT_FREELANCER = ['userId'];

const createOrganicEvent = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      models: {
        User: UserModel, Event: EventModel, EventFreelancer: EventFreelancerModel,
        FreelancerCalender: FreelancerCalenderModel, EventTiming: EventTimingModel, UserBusiness: UserBusinessModel,
      },
      localeService,
    } = ctx;
    const { user } = ctx.req;
    const { data = {} } = args;
    const { timeZone = DEFAULT_TIMEZONE } = data;

    const { timings } = data;
    const eventData = pick(data, EVENT);
    const freelancerData = pick(data, EVENT_FREELANCER);

    if (size(eventData.name) > EVENT_NAME_LIMIT) {
      throw new CustomApolloError(getMessage('EVENT_NAME_CHARACTER_LIMIT_EXCEEDED', localeService));
    }
    const recruiterInstance = await UserModel.findOne({
      where: {
        id: eventData.recruiterId, role: 'RECRUITER', verificationStatus: APPROVED, accountDeletedAt: null,
      },
    });

    if (!recruiterInstance) {
      throw new CustomApolloError(getMessage('RECRUITER_NOT_FOUND', localeService));
    }
    let { startDate, endDate } = data;
    let { recruiterId } = eventData;
    // ADDED CHECK FOR EXISTING CUSTOM EVENT FOR SELECTED DATES
    const existingCustomEvent = await checkExistingCalenderDatesForEvent(recruiterId, startDate, endDate);
    if (existingCustomEvent) {
      throw new CustomApolloError(getMessage('EVENT_ALREADY_EXISTS', localeService));
    }
    const freelancerInstance = await UserModel.findByPk(freelancerData.userId, {
      include: [
        {
          model: UserBusinessModel,
          as: 'business',
          attributes: ['pricePerDay'],
        },
      ],
    });

    if (!freelancerInstance || (freelancerInstance.role !== 'FREELANCER' && freelancerInstance.verificationStatus !== APPROVED
      && freelancerInstance.accountDeletedAt !== null)) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }

    const localStartOfDay = moment().tz(timeZone).startOf('day').format(); // START OF LOCAL DAY TIMEZONE (DEFAULT ASIA/KOLKATA)
    const localEventStartDate = moment(startDate).tz(timeZone).format(); // START DATE OF LOCAL TIMEZONE (DEFAULT ASIA/KOLKATA)
    const localEventEndDate = moment(endDate).tz(timeZone).format(); // END DATE OF LOCAL TIMEZONE (DEFAULT ASIA/KOLKATA)

    if (moment(localEventStartDate).isBefore(localStartOfDay) || moment(localEventEndDate).isBefore(localStartOfDay)) {
      throw new CustomApolloError(getMessage('DATE_CANNOT_BE_BEFORE_CURRENT_TIME', localeService));
    }

    eventData.createdBy = user.id;
    eventData.startDate = startDate;
    eventData.endDate = endDate;
    eventData.totalBudget = get(freelancerInstance, 'business.pricePerDay');
    eventData.leadType = 'ORGANIC';
    eventData.status = 'UPCOMING';
    eventData.freelancers = {
      userId: freelancerData.userId,
      isRequested: true,
    };

    for (const timing of timings) {
      // validate date'
      const { startDate: timingStartDate, endDate: timingEndDate } = timing;
      const validateStartDate = moment(timingStartDate).isBetween(eventData.startDate, eventData.endDate, null, '[]');
      const validateEndDate = moment(timingEndDate).isBetween(eventData.startDate, eventData.endDate, null, '[]');
      if (!validateStartDate || !validateEndDate) {
        throw new CustomApolloError(getMessage('INVALID_TIMINGS', localeService));
      }
    }
    eventData.timings = timings;

    // Set Recruiter calender
    const recruiterCalender = {
      userId: recruiterInstance.id,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
    };
    eventData.freelancerCalender = recruiterCalender;

    const eventInstance = await EventModel.create(eventData, {
      include: [
        {
          model: EventFreelancerModel,
          as: 'freelancers',
        },
        {
          model: EventTimingModel,
          as: 'timings',
        },
        {
          model: FreelancerCalenderModel,
          as: 'freelancerCalender',
        },
      ],
      transaction,
    });

    await transaction.commit();

    const response = {
      status: SUCCESS,
      message: getMessage('ORGANIC_LEAD_CREATED', localeService),
      id: eventInstance.id,
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventsLogger(`Error creating organic-event: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createOrganicEvent;
