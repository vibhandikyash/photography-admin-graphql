/* eslint-disable max-len */
const { validationResult } = require('express-validator');
const _ = require('lodash');

const defaultLogger = require('../../../../../logger');

const {
  models: { UserProfile: UserProfileModel },
} = require('../../../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../../../shared-lib/aws/functions/generate-url-for-keys');
const sendEmailForProfileUnderReview = require('../../../../../shared-lib/emails/profile/send-email-for-profile-under-review');
const createNotificationForUserProfileUnderReview = require('../../../../../shared-lib/notifications/users/create-notification-for-user-profile-under-review');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const removeOriginFromUrl = require('../../../../../utils/remove-origin-from-url');
const { ApiError } = require('../../../../services/custom-api-error');

const updateAadhaar = async (req, res, next) => {
  try {
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, 422);
    }

    const { front, back } = req.body;

    const aadharCardFront = removeOriginFromUrl(front);
    const aadharCardBack = removeOriginFromUrl(back);

    const { user, localeService } = req;
    if (user.verificationStatus === 'APPROVED') throw new ApiError('AADHAAR_NOT_EDITABLE', 400);

    const profile = await UserProfileModel.findOne({ where: { userId: user.id } });
    let profileData;
    if (!profile) {
      profileData = await UserProfileModel.create({
        aadharCardFront,
        aadharCardBack,
        userId: user.id,
      });
    } else {
      profileData = await profile.update({
        aadharCardFront, aadharCardBack,
      });
    }
    // Create a new obj with the aadhar front & back
    const aadhaar = {
      front: profileData.aadharCardFront ? _.values(await getKeysAndGenerateUrl([profileData.aadharCardFront]))[0] : null,
      back: profileData.aadharCardBack ? _.values(await getKeysAndGenerateUrl([profileData.aadharCardBack]))[0] : null,
    };

    // send notification when aadhar card is uploaded
    if (profileData) {
      createNotificationForUserProfileUnderReview(user.id, localeService);
      // send profile under review email
      sendEmailForProfileUnderReview(user.id);
    }
    return sendSuccessResponse(res, 'AADHAR_UPDATE_SUCCESS', 200, aadhaar);
  } catch (error) {
    defaultLogger(`Error while updateAadhaar: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = updateAadhaar;
