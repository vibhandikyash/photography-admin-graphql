const { validationResult } = require('express-validator');

const defaultLogger = require('../../../../../logger');

const {
  models: { UserBusiness: UserBusinessModel },
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const getUserWithRelationship = require('../../../../../utils/get-user-with-relationship');
const { ApiError } = require('../../../../services/custom-api-error');

const updateBusinessDetails = async (req, res, next) => {
  try {
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, 422);
    }

    const {
      tagLine, accomplishments, equipmentList, instagramLink,
    } = req.body;

    let { user } = req;

    // Update user's business data (find and then update business details)
    const userBusiness = await UserBusinessModel.findOne({ where: { userId: user.id } });
    if (!userBusiness) {
      await user.createBusiness({
        tagLine, accomplishments, equipmentList, instagramLink,
      });
    } else {
      await userBusiness.update({
        tagLine, accomplishments, equipmentList, instagramLink,
      });
    }

    // Retrieve the updated profile object
    user = await getUserWithRelationship(user);

    return sendSuccessResponse(res, 'BIZ_UPDATE_SUCCESS', 200, user);
  } catch (error) {
    defaultLogger(`Error while update freelancer BusinessDetails: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = updateBusinessDetails;
