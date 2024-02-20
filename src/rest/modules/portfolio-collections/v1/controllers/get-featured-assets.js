const defaultLogger = require('../../../../../logger');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const getFreelancerFeaturedAssetsService = require('../../../../services/get-freelancer-featured-assets');

const getFeaturedAssets = async (req, res, next) => {
  try {
    const { user } = req;

    const response = await getFreelancerFeaturedAssetsService(user.id);

    return sendSuccessResponse(res, 'SUCCESS', 200, response);
  } catch (error) {
    defaultLogger(`Error while getAllCollection: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getFeaturedAssets;
