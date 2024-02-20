const { map } = require('lodash');
const moment = require('moment');

const {
  PENDING, REGULARIZE_REQUEST_TYPES: { REGULARIZE }, EVENT_HOURS_DIFF, SUCCESS,
} = require('../../../constants/service-constants');

const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const regularizationLogger = require('../regularization-logger');

const createRegularizeWebRequest = async (_, args, ctx) => {
  try {
    const {
      models: {
        EventTiming: EventTimingModel, Event: EventModel, EventFreelancer: EventFreelancerModel,
        FreelancerAttendance: FreelancerAttendanceModel, RegularizeRequest: RegularizeRequestModel,
      },
      req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventTimingId = null } } = args;
    let { data: { startDate, endDate } } = args;

    const eventTimingsInstance = await EventTimingModel.findByPk(eventTimingId);
    if (!eventTimingsInstance) {
      throw new CustomApolloError('EVENT_TIMING_NOT_FOUND', localeService);
    }

    const { eventId } = eventTimingsInstance;
    const eventInstance = await EventModel.findByPk(eventId,
      {
        attributes: ['id', 'startDate', 'endDate'],
        include: {
          model: EventFreelancerModel,
          as: 'freelancers',
          where: { isAssigned: true, userId },
          attributes: ['userId'],
          required: false,
        },
      });

    if (!eventInstance) {
      throw new CustomApolloError('EVENT_NOT_FOUND', localeService);
    }
    const eventFreelancerIds = map(eventInstance.freelancers, 'userId');
    if (!eventFreelancerIds.includes(userId)) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_SEND_REQUEST'), localeService);
    }

    const currentDate = moment().format();

    // Check if the eventTimingsInstanceTime is already created or not
    const eventTimingsInstanceTimings = await RegularizeRequestModel.findOne({ where: { eventTimingId, userId, status: PENDING } });
    if (eventTimingsInstanceTimings) {
      throw new CustomApolloError(getMessage('REGULARIZE_ALREADY_CREATED'), localeService);
    }

    // validate request to be sent after the event end time
    if (moment(currentDate).isBefore(eventTimingsInstance.endDate)) {
      throw new CustomApolloError(getMessage('CANNOT_SEND_REQUEST_BEFORE_EVENT_END_TIME'), localeService);
    }

    // validate the timings entry before 24 hours of the event end date
    const endEventNextDay = moment(eventInstance.endDate).add(EVENT_HOURS_DIFF, 'hours');
    if (moment(currentDate).isAfter(endEventNextDay)) {
      throw new CustomApolloError(getMessage('REQUEST_END_DATE_VALIDATION', localeService, { hours: EVENT_HOURS_DIFF }), localeService);
    }
    startDate = moment(startDate);
    endDate = moment(endDate);

    // validate startDate and endDate
    if (startDate.isAfter(endDate)) {
      throw new CustomApolloError(getMessage('STARTDATE_MUST_NOT_EXCEED_ENDDATE'), localeService);
    }
    const inputDateDiff = endDate.diff(startDate, 'hours');
    if (inputDateDiff > EVENT_HOURS_DIFF) {
      throw new CustomApolloError(getMessage('TOTAL_HOURS_VALIDATION_MESSAGE', localeService, { hours: EVENT_HOURS_DIFF }), localeService);
    }
    const existingFreelancerAttendance = await FreelancerAttendanceModel.findOne({
      where: { eventTimingsId: eventTimingId, userId },
    });
    let freelancerAttendances;
    if (existingFreelancerAttendance) {
      const { firstClockIn, lastClockOut } = existingFreelancerAttendance;
      freelancerAttendances = { firstClockIn, lastClockOut };
    }

    const data = {
      userId,
      startedAt: startDate,
      endedAt: endDate,
      status: PENDING,
      eventId,
      eventTimingId,
      requestType: REGULARIZE,
      metaData: { freelancerAttendances },
    };

    await RegularizeRequestModel.create(data);
    return { status: SUCCESS, message: getMessage('REGULARIZE_REQUEST_SENT_SUCCESSFULLY', localeService) };
  } catch (error) {
    regularizationLogger(`Error from creating regularize request from web, ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createRegularizeWebRequest;
