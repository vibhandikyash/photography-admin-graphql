/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const CONFIG = require('../../config/config');
const {
  models:
  { Category: CategoryModel },
} = require('../../sequelize-client');
const { generateS3PublicUrl } = require('../../shared-lib/aws/functions/generate-get-signed-url');

const homeScreenLogger = require('../modules/freelancers/freelancers-logger');

const getCategoriesService = async () => {
  try {
    const freelancerCategory = await CategoryModel.findAll({
      order: [
        ['order', 'ASC'],
      ],
      attributes: ['id', 'name', 'url'],
    });
    const response = JSON.parse(JSON.stringify(freelancerCategory));
    for (const category of response) {
      const url = await generateS3PublicUrl(category.url, CONFIG.AWS.BUCKET.PUBLIC_BUCKET_NAME);
      category.url = url ?? '';
    }

    return response;
  } catch (error) {
    homeScreenLogger(`Error from get-categories-service: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getCategoriesService;
