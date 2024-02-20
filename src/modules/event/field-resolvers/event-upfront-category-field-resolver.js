const eventLogger = require('../event-logger');

const eventUpfrontCategoryFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { Category: CategoryModel } } = ctx;
    const { categoryType, eventCategory } = parent;

    if (eventCategory) {
      return eventCategory;
    }

    if (!categoryType) {
      return null;
    }

    const eventCreator = await CategoryModel.findByPk(categoryType);
    return eventCreator;
  } catch (err) {
    eventLogger(`Error in eventUpfrontCategoryFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventUpfrontCategoryFieldResolver;
