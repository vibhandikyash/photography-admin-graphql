const { validationResult } = require('express-validator');
const {
  includes,
} = require('lodash');

const {
  freelancerDefaultVideoLimit,
  premiumFreelancerType, premiumFreelancerVideoLimit,
} = require('../../../../../constants/constants');
const defaultLogger = require('../../../../../logger');
const {
  models:
  {
    UserCollection: UserCollectionModel,
    UserCollectionAsset: UserCollectionAssetModel,
    UserProfile: UserProfileModel,
  },
  sequelize,
  Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const getCollectionTypeOfUser = require('../../../../../utils/get-collection-type');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  CREATED, TOO_MANY_REQ, UNAUTHENTICATED, VALIDATION_FAILED,
} = require('../../../../services/http-status-codes');

const addVideo = async (req, res, next) => {
  let transaction;
  try {
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const { user } = req;
    const { title, url } = req.body;

    const collectionType = await getCollectionTypeOfUser(user.id);

    // Check the user's collection type ( image collection type not allowed to upload videos )
    if (collectionType === 'IMAGE') throw new ApiError('UNAUTHORIZED', UNAUTHENTICATED);

    const { typeKey } = await UserProfileModel.findOne({ where: { userId: user.id }, attributes: ['typeKey'] });

    let limit = freelancerDefaultVideoLimit;
    if (includes(premiumFreelancerType, typeKey)) { // if user is premium type them change the limit
      limit = premiumFreelancerVideoLimit;
    }

    const videoAssets = await UserCollectionAssetModel.findAll({ where: { userId: user.id } });
    const assetsCount = videoAssets?.length;

    if (assetsCount >= limit) throw new ApiError('COLLECTION_ASSETS_LIMIT_EXCEEDED', TOO_MANY_REQ);

    const freelancerCollection = {
      userId: user.id,
      type: collectionType,
      name: title,
      createdBy: user.id,
      collectionAssets: {
        title,
        url,
        userId: user.id,
        createdBy: user.id,
      },
    };

    const videoCollection = await UserCollectionModel.create(freelancerCollection, {
      include: [
        {
          model: UserCollectionAssetModel,
          as: 'collectionAssets',
        },
      ],
      transaction,
    });

    await transaction.commit();

    return sendSuccessResponse(res, 'SUCCESS', CREATED, videoCollection);
  } catch (error) {
    defaultLogger(`Error while addVideo: ${error.message}`, null, 'error');
    if (transaction) {
      await transaction.rollback();
    }
    return next(error);
  }
};

module.exports = addVideo;
