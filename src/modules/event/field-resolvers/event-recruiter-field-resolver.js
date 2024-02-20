const { USER_ATTRIBUTES_TO_EXCLUDE } = require('../../../constants/service-constants');
const eventLogger = require('../event-logger');

const eventRecruiterFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { User: UserModel } } = ctx;
    const { recruiterId, recruiter } = parent;

    if (recruiter) {
      return recruiter;
    }

    if (!recruiterId) {
      return null;
    }

    const recruiterInstance = await UserModel.findByPk(recruiterId, {
      attributes: { exclude: USER_ATTRIBUTES_TO_EXCLUDE },
    });
    return recruiterInstance;
  } catch (err) {
    eventLogger(`Error in eventRecruiterFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventRecruiterFieldResolver;
