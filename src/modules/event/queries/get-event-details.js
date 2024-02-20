/* eslint-disable no-param-reassign */
const {
  ORGANIC,
  UPFRONT,
} = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');
const getOrganicEventDetails = require('../functions/get-organic-event-details');
const getUpfrontEventDetails = require('../functions/get-upfront-event-details');

const getEventDetails = async (_, args, ctx) => {
  try {
    const {
      models: {
        Event: EventModel,
      },
      localeService,
    } = ctx;
    const { id } = args;

    const existingEventInstance = await EventModel.findByPk(id, {
      attributes: ['id', 'leadType'],
    });

    if (!existingEventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    let eventData;

    if (existingEventInstance.leadType === ORGANIC) {
      eventData = await getOrganicEventDetails(id, ctx.models);
    }

    if (existingEventInstance.leadType === UPFRONT) {
      eventData = await getUpfrontEventDetails(id, ctx.models);
    }

    return { event: eventData.eventInstance, status: eventData.status };
  } catch (error) {
    eventsLogger(`Error get-event-details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getEventDetails;
