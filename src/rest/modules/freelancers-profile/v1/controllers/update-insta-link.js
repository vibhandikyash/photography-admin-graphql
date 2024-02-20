const { validationResult } = require('express-validator');

const defaultLogger = require('../../../../../logger');

const {
  models: { UserBusiness: UserBusinessModel },
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const getUserWithRelationship = require('../../../../../utils/get-user-with-relationship');
const { ApiError } = require('../../../../services/custom-api-error');

const updateInstaLink = async (req, res, next) => {
  try {
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, 422);
    }

    const { instagramLink } = req.body;

    let { user } = req;

    // Update user's business data
    await UserBusinessModel.update({
      instagramLink,
    }, {
      where: { userId: user.id },
    });

    // Retrieve the updated profile object
    user = await getUserWithRelationship(user);

    return sendSuccessResponse(res, 'INSTA_LINK_UPDATE_SUCCESS', 200, user);
  } catch (error) {
    defaultLogger(`Error while updateInstaLink: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = updateInstaLink;
