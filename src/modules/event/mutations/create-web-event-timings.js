/* eslint-disable no-restricted-syntax */
const moment = require('moment');

const { SUCCESS, EVENT_TIMINGS_DAYS_VALIDATION_DIFF, EVENT_HOURS_DIFF } = require('../../../constants/service-constants');

const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const createWebEventTimings = async (_, args, ctx) => {
  try {
    const {
      models: { Event: EventModel, EventTiming: EventTimingModel }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { data: { timings } = {}, where: { id: eventId = null } = {} } = args;

    const event = await EventModel.findByPk(eventId);
    if (!event || event.recruiterId !== userId) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const { startDate: eventStartDate, endDate: eventEndDate } = event;

    // VALIDATE THE TIMINGS ENTRY BEFORE 15 DAYS
    const currentDate = moment().startOf('day').format();
    const daysDiff = moment(eventStartDate).diff(currentDate, 'days') + 1;

    if (daysDiff < EVENT_TIMINGS_DAYS_VALIDATION_DIFF) {
      throw new CustomApolloError(getMessage('TIMING_DAYS_VALIDATION_MESSAGE', localeService, { daysDiff: EVENT_TIMINGS_DAYS_VALIDATION_DIFF }));
    }

    const eventTimingsData = [];
    for (const timing of timings) {
      const { startDate, endDate } = timing;
      if (moment(startDate).isAfter(endDate)) {
        throw new CustomApolloError(getMessage('STARTDATE_MUST_NOT_EXCEED_ENDDATE', localeService));
      }
      const inputDateDiff = moment(endDate).diff(startDate, 'hours');
      if (inputDateDiff > EVENT_HOURS_DIFF) {
        throw new CustomApolloError(getMessage('TOTAL_HOURS_VALIDATION_MESSAGE', localeService, { hours: EVENT_HOURS_DIFF }));
      }

      const validateStartDate = moment(startDate).isBetween(eventStartDate, eventEndDate, null, '[]');
      if (!validateStartDate) {
        throw new CustomApolloError(getMessage('INVALID_TIMINGS', localeService));
      }

      timing.eventId = eventId;
      eventTimingsData.push(timing);
    }
    await EventTimingModel.bulkCreate(eventTimingsData);
    const response = { status: SUCCESS, message: getMessage('CREATE_TIMINGS_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    eventLogger(`Error creating web event timings: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createWebEventTimings;
