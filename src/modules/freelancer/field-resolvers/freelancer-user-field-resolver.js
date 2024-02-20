const { USER_ATTRIBUTES_TO_EXCLUDE } = require('../../../constants/service-constants');
const freelancerLogger = require('../freelancer-logger');

const freelancerUserFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { User: UserModel } } = ctx;
    const { reviewerId, reviewer } = parent;

    if (reviewer) {
      return reviewer;
    }

    if (!reviewerId) {
      return null;
    }

    const userInstance = await UserModel.findByPk(reviewerId, {
      attributes: { exclude: USER_ATTRIBUTES_TO_EXCLUDE },
    });
    return userInstance;
  } catch (err) {
    freelancerLogger(`Error in freelancerUserFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = freelancerUserFieldResolver;
