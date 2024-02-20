const { USER_ATTRIBUTES_TO_EXCLUDE } = require('../../../constants/service-constants');
const regularizationLogger = require('../regularization-logger');

const regularizeRequestUserFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { User: UserModel } } = ctx;
    const { userId, user } = parent;

    if (typeof userId === 'object') {
      return userId;
    }

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
    regularizationLogger.error(`Error in regularizeRequestUserFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = regularizeRequestUserFieldResolver;
