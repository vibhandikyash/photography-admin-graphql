const { USER_ATTRIBUTES_TO_EXCLUDE } = require('../../../constants/service-constants');
const eventLogger = require('../event-logger');

const eventWedlancerCoordinatorFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { User: UserModel } } = ctx;
    const { assignedTo, assignee } = parent;

    if (assignee) {
      return assignee;
    }

    if (!assignedTo) {
      return null;
    }

    const wedlancerCoordinator = await UserModel.findByPk(assignedTo, {
      attributes: { exclude: USER_ATTRIBUTES_TO_EXCLUDE },
    });
    return wedlancerCoordinator;
  } catch (err) {
    eventLogger(`Error in eventWedlancerCoordinatorFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventWedlancerCoordinatorFieldResolver;
