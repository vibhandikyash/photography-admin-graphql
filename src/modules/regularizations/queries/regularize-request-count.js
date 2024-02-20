const { PENDING } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const regularizationLogger = require('../regularization-logger');

const regularizeRequestCount = async (_, args, ctx) => {
  try {
    const { models: { RegularizeRequest: RegularizeRequestModel, Event: EventModel }, localeService } = ctx;
    const { where: { id: eventId } } = args;

    const existingEvent = await EventModel.findByPk(eventId);
    if (!existingEvent) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND'), localeService);
    }

    const getRequestCount = await RegularizeRequestModel.count({ where: { eventId, status: PENDING } });

    return { count: getRequestCount };
  } catch (error) {
    regularizationLogger(`Error from getting regularization request count, ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = regularizeRequestCount;
