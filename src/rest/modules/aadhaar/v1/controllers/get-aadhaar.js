const _ = require('lodash');

const defaultLogger = require('../../../../../logger');
const {
  models: { UserProfile: UserProfileModel },
} = require('../../../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../../../shared-lib/aws/functions/generate-url-for-keys');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');

const getAadhaar = async (req, res, next) => {
  try {
    const { user } = req;

    // Get user's profile data
    const profileData = await UserProfileModel.findOne({ where: { userId: user.id } });

    if (!profileData) throw new ApiError('AADHAAR_NOT_FOUND', 404);

    // Create a new obj with the aadhar front & back
    const aadhaar = {
      front: profileData.aadharCardFront ? _.values(await getKeysAndGenerateUrl([profileData.aadharCardFront]))[0] : null,
      back: profileData.aadharCardBack ? _.values(await getKeysAndGenerateUrl([profileData.aadharCardBack]))[0] : null,
    };

    return sendSuccessResponse(res, 'SUCCESS', 200, aadhaar);
  } catch (error) {
    defaultLogger(`Error while getAadhaar: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getAadhaar;
