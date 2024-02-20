/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { IMAGE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { models: { UserCollection: FreelancerCollectionModel, UserCollectionAsset: CollectionAssetsModel } } = require('../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');
const getCollectionTypeOfUser = require('../../../utils/get-collection-type');

const listFreelancerPortfolioCollectionsService = async userId => {
  try {
    const collectionsData = [];

    const collections = await FreelancerCollectionModel.findAll(
      {
        where: { userId },
        attributes: ['name', 'id', 'type'],
        include: [
          {
            model: CollectionAssetsModel,
            as: 'collectionAssets',
            attributes: ['id', 'url', 'isFeatured'],
            required: false,
            order: [
              [
                'createdAt',
                'ASC',
              ],
            ],
            limit: 3,
          },
        ],
        order: [['createdAt', 'DESC']],
      },
    );

    const type = await getCollectionTypeOfUser(userId);

    for (let collection of collections) {
      const { collectionAssets } = collection;
      collection = JSON.parse(JSON.stringify(collection));
      if (type === IMAGE) {
        for (const asset of collectionAssets) {
          [asset.url] = await getKeysAndGenerateUrl([asset.url]);
        }
      }
      collection.collectionAssets = collectionAssets;
      collectionsData.push({ ...collection });
    }
    const response = {
      type,
      collections: collectionsData,
    };
    return response;
  } catch (error) {
    defaultLogger(`Error from listing freelancer portfolio collections service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = listFreelancerPortfolioCollectionsService;
