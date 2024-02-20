const { validationResult } = require('express-validator');

const defaultLogger = require('../../../../../logger');

const {
  models: {
    Category: CategoryModel,
    UserCollection: UserCollectionModel,
    UserCollectionAsset: UserCollectionAssetModel,
    UserProfile: UserProfileModel,
    UserBusiness: UserBusinessModel,
  }, sequelize, Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const getUserWithRelationship = require('../../../../../utils/get-user-with-relationship');
const removeOriginFromUrl = require('../../../../../utils/remove-origin-from-url');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  NOT_FOUND, OK, VALIDATION_FAILED,
} = require('../../../../services/http-status-codes');

const updateProfile = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }
    let { user } = req;
    const profile = await UserProfileModel.findOne({ where: { userId: user.id } });

    const {
      fullName, userName, primaryLocation, secondaryLocation, category, bio, pricePerDay, profilePhoto,
    } = req.body;

    const updateAttribute = {
      fullName, userName, primaryLocation, secondaryLocation, category, bio, pricePerDay, profilePhoto,
    };
    if (profile.typeKey === 'FREE') {
      delete updateAttribute.secondaryLocation;
    }

    updateAttribute.profilePhoto = updateAttribute.profilePhoto ? removeOriginFromUrl(updateAttribute.profilePhoto) : null;

    await user.update({ fullName, userName }, { transaction }); // update user

    // update user's profile
    await profile.update({
      bio, profilePhoto: updateAttribute.profilePhoto,
    }, {
      transaction,
    });

    const categoryObj = await CategoryModel.findOne({ where: { name: category } });
    if (!categoryObj) {
      throw new ApiError('FREELANCER_CATEGORY_NOT_FOUND', NOT_FOUND);
    }

    // Update user's business data
    const userBusiness = await UserBusinessModel.findOne({ where: { userId: user.id } });
    updateAttribute.categoryId = categoryObj.id;

    if (!userBusiness) {
      await user.createBusiness(updateAttribute, {
        transaction,
      });
    } else {
      const oldCategory = userBusiness.categoryId;
      await userBusiness.update(updateAttribute, {
        transaction,
      });
      const newCategory = userBusiness.categoryId;

      // Delete collection & collection assets when user category is updated.
      if (oldCategory !== newCategory) {
        defaultLogger(`Freelancer's (userId: ${user.id}) category changed to: ${category}`, null, 'info');

        await UserCollectionModel.destroy({ where: { userId: user.id }, transaction });
        await UserCollectionAssetModel.destroy({ where: { userId: user.id }, transaction });
      }
    }

    await transaction.commit();

    // Retrieve the updated profile object
    user = await getUserWithRelationship(user);

    return sendSuccessResponse(res, 'USER_UPDATE_SUCCESS', OK, user);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    defaultLogger(`Error while update freelancer Profile: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = updateProfile;
