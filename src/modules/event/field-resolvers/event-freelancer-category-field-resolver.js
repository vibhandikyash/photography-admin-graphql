const { isEmpty } = require('lodash');

const eventLogger = require('../event-logger');

const eventFreelancerCategoryFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { Category: CategoryModel, UserBusiness: UserBusinessModel } } = ctx;
    const { userId, eventFreelancers } = parent;
    if (eventFreelancers) {
      return eventFreelancers;
    }

    if (!userId) {
      return null;
    }

    const user = await UserBusinessModel.findOne({
      where: { userId },
      include: { model: CategoryModel, as: 'userCategory', attributes: ['id', 'name'] },
    });
    if (isEmpty(user) || isEmpty(user.userCategory)) {
      return null;
    }
    const { userCategory } = user;
    return userCategory;
  } catch (err) {
    eventLogger(`Error in eventFreelancerCategoryFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventFreelancerCategoryFieldResolver;
