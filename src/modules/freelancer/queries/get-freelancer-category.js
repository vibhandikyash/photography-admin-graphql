/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const CONFIG = require('../../../config/config');
const { generateS3PublicUrl } = require('../../../shared-lib/aws/functions/generate-get-signed-url');
const freelancerLogger = require('../freelancer-logger');

const getFreelancerCategory = async (_, args, ctx) => {
  try {
    const {
      models: {
        Category: FreelancerCategoryModel,
      },
    } = ctx;

    const freelancerCategory = await FreelancerCategoryModel.findAll();
    for (const category of freelancerCategory) {
      const url = await generateS3PublicUrl(category.url, CONFIG.AWS.BUCKET.PUBLIC_BUCKET_NAME);
      category.url = url ?? '';
    }
    return freelancerCategory;
  } catch (error) {
    freelancerLogger(`Error from get freelancer badge: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerCategory;
