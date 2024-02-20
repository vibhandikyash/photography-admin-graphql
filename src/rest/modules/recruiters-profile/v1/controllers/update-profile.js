const { validationResult } = require('express-validator');

const defaultLogger = require('../../../../../logger');

const {
  models: {
    UserProfile: UserProfileModel, UserBusiness: UserBusinessModel,
  }, sequelize, Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const getUserWithRelationship = require('../../../../../utils/get-user-with-relationship');
const removeOriginFromUrl = require('../../../../../utils/remove-origin-from-url');
const { ApiError } = require('../../../../services/custom-api-error');

const updateProfile = async (req, res, next) => {
  let transaction;
  try {
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message
      throw new ApiError(extractedError, 422);
    }
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const {
      fullName, companyName, addressLine1, addressLine2, country, state, city, zipCode,
    } = req.body;

    let { profilePhoto } = req.body;
    profilePhoto = profilePhoto ? removeOriginFromUrl(profilePhoto) : null;

    let { user } = req;

    if (fullName) await user.update({ fullName }, { transaction }); // update user

    // update user's profile
    await UserProfileModel.update({
      profilePhoto,
    }, {
      where: { userId: user.id },
      transaction,
    });

    // Update or create user's business data
    const userBusiness = await UserBusinessModel.findOne({ where: { userId: user.id } });
    if (!userBusiness) {
      await user.createBusiness({
        companyName,
        addressLine1,
        addressLine2,
        country,
        state,
        city,
        zipCode,
      }, {
        transaction,
      });
    } else {
      await userBusiness.update({
        companyName,
        addressLine1,
        addressLine2,
        country,
        state,
        city,
        zipCode,
      }, { transaction });
    }

    await transaction.commit();

    // Retrieve the updated profile object
    user = await getUserWithRelationship(user);

    return sendSuccessResponse(res, 'USER_UPDATE_SUCCESS', 200, user);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    defaultLogger(`Error while update recruiter Profile: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = updateProfile;
