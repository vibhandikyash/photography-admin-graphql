const defaultLogger = require('../../logger');

const {
  models: {
    Category: CategoryModel,
    UserBusiness: UserBusinessModel,
  },
} = require('../../sequelize-client');

/**
 * Get the updated user object with the relative values
 * @param {string} userId
 * @returns UserModel
 */
const getUserCategoryService = async userId => {
  try {
    if (!userId) return false; // If no userId provided, return false

    const response = await UserBusinessModel.findOne({
      where: {
        userId,
      },
      attributes: ['projectsComplete', 'tagLine', 'pricePerDay', 'primaryLocation', 'secondaryLocation',
        'accomplishments', 'equipmentList', 'instagramLink'],
      include: [{
        model: CategoryModel,
        as: 'userCategory',
        attributes: ['name'],
      }],
    });

    if (!response || !response.userCategory) return false;

    return response.userCategory.name;
  } catch (error) {
    defaultLogger(`Error in get-user-category: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getUserCategoryService;
