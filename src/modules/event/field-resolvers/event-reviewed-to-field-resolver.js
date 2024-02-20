const { USER_ATTRIBUTES_TO_EXCLUDE } = require('../../../constants/service-constants');
const eventLogger = require('../event-logger');

const eventReviewedToFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { User: UserModel } } = ctx;
    const { userId, user } = parent;

    if (user) {
      return user;
    }

    if (!userId) {
      return null;
    }

    const userInstance = await UserModel.findByPk(userId, {
      attributes: { exclude: USER_ATTRIBUTES_TO_EXCLUDE },
    });
    return userInstance;
  } catch (err) {
    eventLogger(`Error in eventReviewedToFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventReviewedToFieldResolver;
