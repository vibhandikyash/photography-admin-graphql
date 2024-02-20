const { validationResult } = require('express-validator');

const defaultLogger = require('../../../../../logger');
const {
  models: {
    Category: CategoryModel,
    User: UserModel,
    UserProfile: UserProfileModel,
    UserBusiness: UserBusinessModel,
    UserType: UserTypeModel,
  }, sequelize, Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  NOT_FOUND, CREATED, BAD_REQUEST, VALIDATION_FAILED,
} = require('../../../../services/http-status-codes');

const onboardFreelancer = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }

    const {
      fullName, userName, category, primaryLocation, profilePhoto = null, pricePerDay,
    } = req.body;

    let { user } = req;

    user = await UserModel.findByPk(user.id, {
      include: { model: UserBusinessModel, as: 'business' },
    });

    // Check the user is already onboard or not by check the user userName
    if (user.userName !== null) {
      throw new ApiError('ALREADY_ONBOARD', BAD_REQUEST);
    }

    const categoryObj = await CategoryModel.findOne({ where: { name: category } });
    if (!categoryObj) {
      throw new ApiError('FREELANCER_CATEGORY_NOT_FOUND', NOT_FOUND);
    }

    const typeObj = await UserTypeModel.findOne({ where: { key: 'FREE', category: 'FREELANCER' } });

    await user.update({ fullName, userName, typeKey: typeObj.id }, { transaction });

    await UserBusinessModel.update({ primaryLocation, categoryId: categoryObj.id, pricePerDay }, { where: { userId: user.id } }, { transaction });

    await UserProfileModel.update(
      { profilePhoto },
      { where: { userId: user.id } },
      transaction,
    );

    await transaction.commit();

    return sendSuccessResponse(res, 'ONBOARD_SUCCESS', CREATED);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    defaultLogger(`Error while onboardFreelancer: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = onboardFreelancer;
