const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const getWebUpfrontCategoryFreelancer = async (_, args, ctx) => {
  try {
    const {
      models: {
        UpfrontCategoryRequirement: UpfrontCategoryRequirementModel,
        EventFreelancer: EventFreelancerModel, Event: EventModel,
      }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;
    const existingEvent = await EventModel.findByPk(eventId);
    if (!existingEvent || existingEvent.recruiterId !== userId) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    const freelancers = await UpfrontCategoryRequirementModel.findAll({
      where: { eventId },
      attributes: ['id', 'categoryType', 'count', 'pricePerDay'],
      include: [{
        model: EventFreelancerModel,
        as: 'freelancers',
        attributes: ['id', 'userId', 'finalizedPrice', 'isAssigned', 'isRequested'],
      }],
    });
    return freelancers;
  } catch (error) {
    eventLogger(`Error from getting web upfront category freelancers: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getWebUpfrontCategoryFreelancer;
