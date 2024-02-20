const { validationResult } = require('express-validator');

const defaultLogger = require('../../../../../logger');

const { models: { UserProfile: UserProfileModel } } = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');

const updateCoverPhoto = async (req, res, next) => {
  try {
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, 422);
    }

    const { coverPhoto } = req.body;

    const { user } = req;

    // Update user's business data
    await UserProfileModel.update({
      coverPhoto,
    }, {
      where: { userId: user.id },
    });

    return sendSuccessResponse(res, 'COVER_PHOTO_UPDATE_SUCCESS', 200);
  } catch (error) {
    defaultLogger(`Error while updating coverPhoto: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = updateCoverPhoto;
