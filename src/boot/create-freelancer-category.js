const defaultLogger = require('../logger');

const categoriesObj = require('./data/freelancer-category');

const createFreelancerCategory = async models => {
  try {
    const { Category: CategoryModel } = models;

    const categories = async () => {
      try {
        const freelancerCategories = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const category of categoriesObj) {
          // eslint-disable-next-line no-await-in-loop
          const count = await CategoryModel.count({
            where: { name: category.name },
          });
          if (!count) {
            freelancerCategories.push(category);
          }
        }
        if (freelancerCategories.length) {
          await CategoryModel.bulkCreate(freelancerCategories);
        }
      } catch (error) {
        defaultLogger(`Error while bulk create categories > ${error}`, null, 'error');
        throw error;
      }
    };

    setTimeout(async () => {
      await categories();
    }, 10000);
  } catch (error) {
    defaultLogger(`Error while creating freelancer categories ${error}`, null, 'error');
  }
};

module.exports = createFreelancerCategory;
