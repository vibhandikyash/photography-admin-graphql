const { USER_ATTRIBUTES_TO_EXCLUDE } = require('../../../constants/service-constants');
const eventLogger = require('../event-logger');

const eventFreelancerFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { User: UserModel, UserProfile: UserProfileModel } } = ctx;
    const { userId, eventFreelancers } = parent;

    if (eventFreelancers) {
      return eventFreelancers;
    }

    if (!userId) {
      return null;
    }

    const user = await UserModel.findByPk(userId, {
      attributes: { exclude: USER_ATTRIBUTES_TO_EXCLUDE },
      include: {
        model: UserProfileModel,
        as: 'profile',
        attributes: ['typeKey'],
      },
    });
    return user;
  } catch (err) {
    eventLogger(`Error in eventFreelancerFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventFreelancerFieldResolver;
