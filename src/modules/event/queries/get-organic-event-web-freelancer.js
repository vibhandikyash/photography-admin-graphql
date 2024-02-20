const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const getOrganicEventWebFreelancer = async (_, args, ctx) => {
  try {
    const {
      models: { Event: EventModel, EventFreelancer: EventFreelancerModel }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;
    const event = await EventModel.findByPk(eventId);
    if (!event || event.recruiterId !== userId) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const freelancers = await EventFreelancerModel.findAll({ where: { eventId } });

    // REMOVED ERROR AS RETURNING NULL IF NOT FOUND, FE REQUIREMENT
    // if (!freelancer) {
    //   throw new CustomApolloError(getMessage('FREELANCER_NOT_ASSIGNED', localeService));
    // }
    return freelancers;
  } catch (error) {
    eventLogger(`Error from getting organic event web freelancer: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getOrganicEventWebFreelancer;
