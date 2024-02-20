const freelancerLogger = require('../freelancer-logger');

const freelancerEventFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { Event: EventModel } } = ctx;
    const { eventId, event } = parent;

    if (event) {
      return event;
    }

    if (!eventId) {
      return null;
    }

    const eventInstance = await EventModel.findByPk(eventId, { attributes: ['id', 'name'] });
    return eventInstance;
  } catch (err) {
    freelancerLogger(`Error in freelancerEventFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = freelancerEventFieldResolver;
