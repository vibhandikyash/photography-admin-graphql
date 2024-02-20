const moment = require('moment');

const { EVENT_HOURS_DIFF, EVENT_TIMINGS_DAYS_VALIDATION_DIFF } = require('../../../../../constants/service-constants');

const {
  Event: EventModel,
  EventTiming: EventTimingModel,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const { BAD_REQUEST } = require('../../../../services/http-status-codes');
const eventLogger = require('../../../events/event-logger');

const createRecruiterEventTiming = async (req, res, next) => {
  try {
    const { body: { eventId, timings }, localeService } = req;

    if (!validateUUID(eventId)) throw new ApiError('INVALID_INPUT', 406);

    const event = await EventModel.findByPk(eventId, { attributes: ['id', 'startDate', 'endDate'] });
    if (!event) {
      throw new ApiError('EVENT_NOT_FOUND', 404);
    }

    // validate the timings entry before 15 days
    const currentDate = moment().startOf('day').format();
    const daysDiff = moment(event.startDate).diff(currentDate, 'days') + 1;

    if (daysDiff < EVENT_TIMINGS_DAYS_VALIDATION_DIFF) {
      throw new ApiError(getMessage('TIMING_DAYS_VALIDATION_MESSAGE', localeService, { daysDiff: EVENT_TIMINGS_DAYS_VALIDATION_DIFF }), BAD_REQUEST);
    }

    // Check if the eventTime is already created or not
    const eventTimings = await EventTimingModel.findOne({ where: { eventId } });
    if (eventTimings) {
      throw new ApiError(getMessage('EVENT_TIMING_ALREADY_ADDED'), BAD_REQUEST);
    }

    /* eslint-disable no-await-in-loop */
    /* eslint-disable no-restricted-syntax */
    // Add eventId to object
    const timingsData = [];
    for (const eventTime of timings) {
      let { startTime, endTime } = eventTime;
      delete eventTime.startTime;
      delete eventTime.endTime;

      eventTime.eventId = eventId;
      startTime = moment(startTime);
      endTime = moment(endTime);

      // validate startTime and endTime
      if (startTime.isAfter(endTime)) {
        throw new ApiError(getMessage('STARTDATE_MUST_NOT_EXCEED_ENDDATE'), BAD_REQUEST);
      }
      const inputDateDiff = endTime.diff(startTime, 'hours');
      if (inputDateDiff > EVENT_HOURS_DIFF) {
        throw new ApiError(getMessage('TOTAL_HOURS_VALIDATION_MESSAGE', localeService, { hours: EVENT_HOURS_DIFF }), BAD_REQUEST);
      }

      const validateStartDate = moment(startTime).isBetween(event.startDate, event.endDate, null, '[]');

      if (!validateStartDate) {
        throw new ApiError(getMessage('INVALID_TIMINGS'), BAD_REQUEST);
      }
      eventTime.startDate = startTime;
      eventTime.endDate = endTime;
      timingsData.push(eventTime);
    }
    // Insert bulk timing
    const data = await EventTimingModel.bulkCreate(timingsData);

    return sendSuccessResponse(res, 'SUCCESS', 201, data);
  } catch (error) {
    eventLogger(`Error from create-event-timing: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = createRecruiterEventTiming;
