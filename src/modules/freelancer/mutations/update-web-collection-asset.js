const { get } = require('lodash');

const {
  SUCCESS, CONFIGURATION_KEYS: { MAX_FEATURED_ASSETS, MAX_FEATURED_VIDEO }, VIDEO, IMAGE,
} = require('../../../constants/service-constants');
const { getConfigByKey } = require('../../../shared-lib/configurations');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const updateWebCollectionAsset = async (_, args, ctx) => {
  try {
    const {
      models: { UserCollectionAsset: UserCollectionAssetModel, UserCollection: UserCollectionModel },
      req: { user: { id: userId } }, localeService,
    } = ctx;
    const { data, where: { id } } = args;
    const existingCollectionAsset = await UserCollectionAssetModel.findByPk(id, { include: { model: UserCollectionModel, as: 'collectionAssets' } });
    if (!existingCollectionAsset) {
      throw new CustomApolloError(getMessage('COLLECTION_ASSET_NOT_FOUND', localeService));
    }
    const type = get(existingCollectionAsset, 'collectionAssets.type');
    let maxFeaturedAssetsLimit;
    if (type === IMAGE) {
      [maxFeaturedAssetsLimit] = await getConfigByKey([MAX_FEATURED_ASSETS]);
    } else if (type === VIDEO) {
      [maxFeaturedAssetsLimit] = await getConfigByKey([MAX_FEATURED_VIDEO]);
    }
    const existingFeaturedAssetCount = await UserCollectionAssetModel.count({ where: { userId, isFeatured: true } });
    const { isFeatured } = data;
    if (isFeatured) {
      if (existingFeaturedAssetCount >= maxFeaturedAssetsLimit) {
        throw new CustomApolloError(getMessage('FEATURE_LIMIT_EXCEEDED', localeService));
      }
    }
    await UserCollectionAssetModel.update(data, { where: { id } });
    const response = { status: SUCCESS, message: getMessage('UPDATED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    freelancerLogger(`Error updating freelancer web collection asset: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateWebCollectionAsset;

