const { USER_ATTRIBUTES_TO_EXCLUDE } = require('../../../constants/service-constants');
const eventLogger = require('../event-logger');

const eventCreatorFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { User: UserModel } } = ctx;
    const { createdBy: createdById, creator } = parent;

    if (creator) {
      return creator;
    }

    if (!createdById) {
      return null;
    }

    const eventCreator = await UserModel.findByPk(createdById, {
      attributes: { exclude: USER_ATTRIBUTES_TO_EXCLUDE },
    });
    return eventCreator;
  } catch (err) {
    eventLogger(`Error in eventCreatorFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventCreatorFieldResolver;
