const { validationResult } = require('express-validator');
const {
  includes, map, uniq, values,
} = require('lodash');

const {
  freelancerDefaultCollectionAssetsLimit,
  premiumFreelancerType, premiumFreelancerCollectionAssetsLimit,
} = require('../../../../../constants/constants');

const defaultLogger = require('../../../../../logger');
const {
  models:
   {
     UserCollectionAsset: UserCollectionAssetModel,
     UserCollection: UserCollectionModel,
     UserProfile: UserProfileModel,
   }, sequelize, Sequelize,
} = require('../../../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../../../shared-lib/aws/functions/generate-url-for-keys');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const getCollectionTypeOfUser = require('../../../../../utils/get-collection-type');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');

const addFiles = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, 422);
    }

    const { user } = req;
    const { files } = req.body;
    const { id: collectionId } = req.params;

    if (!validateUUID(collectionId)) throw new ApiError('INVALID_INPUT', 422);

    // validate collection us exists or not
    const collection = await UserCollectionModel.findOne({
      where: { userId: user.id, id: collectionId },
    });
    if (!collection) throw new ApiError('COLLECTION_NOT_FOUND', 404);

    const collectionType = await getCollectionTypeOfUser(user.id);

    // Check the user's collection type ( video collection type not allowed to upload i image )
    if (collectionType === 'VIDEO') throw new ApiError('UNAUTHORIZED', 401);

    const { typeKey } = await UserProfileModel.findOne({ where: { userId: user.id }, attributes: ['typeKey'] });

    let limit = freelancerDefaultCollectionAssetsLimit;
    if (includes(premiumFreelancerType, typeKey)) { // if user is premium type them change the limit
      limit = premiumFreelancerCollectionAssetsLimit;
    }
    const assetsCount = collection.collectionAssets?.length;

    if (assetsCount >= limit) throw new ApiError('COLLECTION_ASSETS_LIMIT_EXCEEDED', 429);

    // check for unique url
    const existingUrls = map(collection.collectionAssets, 'url');
    const urlsToCheck = [...existingUrls, ...files];
    const assetsUrl = uniq(urlsToCheck);
    if (assetsUrl.length !== urlsToCheck.length) throw new ApiError('URL_MUST_BE_UNIQUE', 406);

    const promiseArr = [];
    /* eslint-disable */
    for (const fileUrl of files) {
      promiseArr.push(
        UserCollectionAssetModel.create({ title: 'IMAGE', url: fileUrl, userId: user.id, collectionId }, { transaction }),
      );
    }
    /* eslint-enable */

    await Promise.all(promiseArr);

    await transaction.commit();

    const upCollection = await UserCollectionModel.findOne({
      include: [
        {
          model: UserCollectionAssetModel,
          as: 'collectionAssets',
          attributes: ['id', 'title', 'url', 'isFeatured'],
        },
      ],
      where: { userId: user.id, id: collectionId },
      attributes: ['id', 'name'],
    });
    const response = JSON.parse(JSON.stringify(upCollection)).collectionAssets;
    /* eslint-disable no-await-in-loop */
    /* eslint-disable no-restricted-syntax */
    for (const asset of response) {
      asset.url = asset.url ? values(await getKeysAndGenerateUrl([asset.url]))[0] : null;
    }

    return sendSuccessResponse(res, 'FILE_ADDED_SUCCESS', 201, response);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    defaultLogger(`Error while addFiles: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = addFiles;
