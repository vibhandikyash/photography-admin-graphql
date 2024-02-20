const defaultLogger = require('../../../../../logger');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const getCategoriesService = require('../../../../services/get-categories-service');

const getCategories = async (req, res, next) => {
  try {
    const categories = await getCategoriesService();

    return sendSuccessResponse(res, 'SUCCESS', 200, categories);
  } catch (error) {
    defaultLogger(`Error from get-categories: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getCategories;
