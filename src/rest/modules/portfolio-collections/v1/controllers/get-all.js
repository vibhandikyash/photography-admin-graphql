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

const getAllCollections = async (req, res, next) => {
  try {
    const { user } = req;

    const collections = await UserCollectionModel.findAll({
      include: [
        {
          model: UserCollectionAssetModel,
          as: 'collectionAssets',
          attributes: ['id', 'title', 'url', 'isFeatured'],
        },
      ],
      where: { userId: user.id },
      attributes: ['id', 'name'],
    });

    const responses = JSON.parse(JSON.stringify(collections));

    for (const collection of responses) {
      for (const asset of collection.collectionAssets) {
        asset.url = asset.url ? values(await getKeysAndGenerateUrl([asset.url]))[0] : null;
      }
    }

    return sendSuccessResponse(res, 'SUCCESS', 200, responses);
  } catch (error) {
    defaultLogger(`Error while getAllCollection: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getAllCollections;
