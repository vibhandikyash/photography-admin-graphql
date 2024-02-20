const { get } = require('lodash');

const { WEDLANCER_ASSURED } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const removeWedlancerCoordinator = async (eventId, transaction, ctx) => {
  try {
    const {
      models: {
        User: UserModel, UserProfile: UserProfileModel, EventFreelancer: EventFreelancerModel,
        Event: EventModel,
      }, localeService,
    } = ctx;

    const eventInstance = await EventModel.findByPk(eventId, {
      attributes: ['id', 'assignedTo', 'isAssigned'],
      include: [
        {
          model: EventFreelancerModel,
          as: 'freelancers',
          where: { isAssigned: true },
          required: false,
          attributes: ['userId'],
          include: [
            {
              model: UserModel,
              as: 'eventFreelancers',
              attributes: ['id'],
              include: [
                {
                  model: UserProfileModel,
                  as: 'profile',
                  attributes: ['typeKey'],
                },
              ],
            },
          ],
        },
      ],
      transaction,
    });

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const { freelancers = [], assignedTo } = eventInstance;
    if (assignedTo) {
      const wedlancerAssuredFreelancers = freelancers.filter(freelancer => {
        const typeKey = get(freelancer, 'eventFreelancers.profile.typeKey');
        return typeKey === WEDLANCER_ASSURED;
      });
      if (wedlancerAssuredFreelancers && wedlancerAssuredFreelancers.length === 0) {
        eventInstance.isAssigned = false;
        eventInstance.assignedTo = null;
        await eventInstance.save({ transaction });
      }
    }
  } catch (error) {
    eventLogger(`Error while removeWedlancerCoordinator : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = removeWedlancerCoordinator;
