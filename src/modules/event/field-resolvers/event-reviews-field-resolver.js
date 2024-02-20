const eventLogger = require('../event-logger');

const eventReviewsFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { Event: EventModel } } = ctx;
    const { eventId, event } = parent;

    if (event) {
      return event;
    }

    if (!eventId) {
      return null;
    }

    const eventInstance = await EventModel.findByPk(eventId);
    return eventInstance;
  } catch (err) {
    eventLogger(`Error in eventReviewFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventReviewsFieldResolver;
