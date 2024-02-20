const { USER_ATTRIBUTES_TO_EXCLUDE } = require('../../../constants/service-constants');
const eventLogger = require('../event-logger');

const eventCancelledByUserFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { User: UserModel } } = ctx;
    const { cancelledBy, cancelledByUser } = parent;

    if (cancelledByUser) {
      return cancelledByUser;
    }

    if (!cancelledBy) {
      return null;
    }

    const user = await UserModel.findByPk(cancelledBy, {
      attributes: { exclude: USER_ATTRIBUTES_TO_EXCLUDE },
    });
    return user;
  } catch (err) {
    eventLogger(`Error in eventCancelledByUserFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventCancelledByUserFieldResolver;
