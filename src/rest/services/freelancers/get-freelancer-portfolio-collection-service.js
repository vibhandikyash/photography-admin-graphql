/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { IMAGE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { models: { UserCollection: FreelancerCollectionModel, UserCollectionAsset: CollectionAssetsModel } } = require('../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');

const getFreelancerPortfolioCollectionService = async (where = {}, localeService) => {
  try {
    const collection = await FreelancerCollectionModel.findOne(
      {
        where,
        attributes: ['name', 'id', 'type'],
        include: [
          {
            model: CollectionAssetsModel,
            as: 'collectionAssets',
            attributes: ['id', 'collectionId', 'url', 'title', 'isFeatured'],
          },
        ],
        order: [[{ model: CollectionAssetsModel, as: 'collectionAssets' }, 'createdAt', 'DESC']],
      },
    );

    if (!collection) {
      throw new CustomApolloError(getMessage('COLLECTION_NOT_FOUND', localeService));
    }

    const { collectionAssets } = collection;

    if (collection.type === IMAGE) {
      if (collectionAssets.length) {
        for (const asset of collectionAssets) {
          [asset.url] = await getKeysAndGenerateUrl([asset.url]);
        }
      }
    }
    return collection;
  } catch (error) {
    defaultLogger(`Error from getting freelancer portfolio collection service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getFreelancerPortfolioCollectionService;
