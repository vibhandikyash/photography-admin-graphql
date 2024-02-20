/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const moment = require('moment');

const { SUCCESS } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');

const createEventTimings = async (_, args, ctx) => {
  try {
    const { data: { timings }, where: { eventId } } = args;
    const {
      models: {
        Event: EventModel, EventTiming: EventTimingModel,
      },
      localeService,
    } = ctx;

    // check event exist or not
    const event = await EventModel.findByPk(eventId);
    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    const { startDate: eventStartDate, endDate: eventEndDate } = event;
    const bulkEventTimingData = [];

    // create event timings
    for (const timing of timings) {
      const { startDate, endDate } = timing;
      const validateStartDate = moment(startDate).isBetween(eventStartDate, eventEndDate, null, '[]');
      const validateEndDate = moment(endDate).isBetween(eventStartDate, eventEndDate, null, '[]');

      if (!validateStartDate || !validateEndDate) { throw new CustomApolloError(getMessage('INVALID_TIMINGS', localeService)); }
      timing.eventId = eventId;
      bulkEventTimingData.push(timing);
    }

    await EventTimingModel.bulkCreate(bulkEventTimingData);

    const response = {
      message: getMessage('CREATE_TIMINGS_SUCCESSFULLY', localeService),
      status: SUCCESS,
    };
    return response;
  } catch (error) {
    eventsLogger(`Error creating organic-event: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createEventTimings;
