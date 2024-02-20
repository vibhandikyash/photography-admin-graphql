const defaultLogger = require('../../../../../logger');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const getFreelancerFeaturedAssetsService = require('../../../../services/get-freelancer-featured-assets');

const getFreelancerFeaturedAssets = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!validateUUID(userId)) throw new ApiError('INVALID_INPUT', 406);

    const response = await getFreelancerFeaturedAssetsService(userId);

    return sendSuccessResponse(res, 'SUCCESS', 200, response);
  } catch (error) {
    defaultLogger(`Error in get-featured-assets: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getFreelancerFeaturedAssets;
