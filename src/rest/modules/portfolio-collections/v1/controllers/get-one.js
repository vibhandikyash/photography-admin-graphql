/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { values } = require('lodash');

const defaultLogger = require('../../../../../logger');
const {
  models:
   { UserCollection: UserCollectionModel, UserCollectionAsset: UserCollectionAssetModel },
} = require('../../../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../../../shared-lib/aws/functions/generate-url-for-keys');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');

const getOneCollection = async (req, res, next) => {
  try {
    const { id: collectionId } = req.params;
    // Validate the request UUID
    const isValidUUID = validateUUID(collectionId);
    if (!isValidUUID) throw new ApiError('INVALID_INPUT', 422);

    const { user } = req;

    const collection = await UserCollectionModel.findOne({
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

    if (!collection) throw new ApiError('COLLECTION_NOT_FOUND', 404);

    const response = JSON.parse(JSON.stringify(collection));

    for (const asset of response.collectionAssets) {
      asset.url = asset.url ? values(await getKeysAndGenerateUrl([asset.url]))[0] : null;
    }
    return sendSuccessResponse(res, 'SUCCESS', 200, response);
  } catch (error) {
    defaultLogger(`Error while get-one: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getOneCollection;
