const { defaultFeaturedAssetsLimit, defaultFeaturedVideosLimit } = require('../../../../../constants/constants');
const { CONFIGURATION_KEYS: { MAX_FEATURED_ASSETS, MAX_FEATURED_VIDEO } } = require('../../../../../constants/service-constants');
const defaultLogger = require('../../../../../logger');
const { models: { UserCollectionAsset: UserCollectionAssetModel } } = require('../../../../../sequelize-client');
const { getConfigByKey } = require('../../../../../shared-lib/configurations');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const getCollectionTypeOfUser = require('../../../../../utils/get-collection-type');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  OK, NOT_FOUND, INVALID_INPUT, BAD_REQUEST,
} = require('../../../../services/http-status-codes');

const makeImageFeatured = async (req, res, next) => {
  try {
    const { user } = req;
    const { assetId } = req.params;

    // Validate the assetsId
    if (!validateUUID(assetId)) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    // validate collection us exists or not
    const asset = await UserCollectionAssetModel.findOne({
      where: { id: assetId, userId: user.id },
      attributes: ['id', 'title', 'url', 'isFeatured'],
    });
    if (!asset) throw new ApiError('ASSET_NOT_FOUND', NOT_FOUND);

    // Check & handle the featured limitations
    const [maxAssetLimit, maxVideoLimit] = await getConfigByKey([MAX_FEATURED_ASSETS, MAX_FEATURED_VIDEO]);
    // Get the assets count that are currently featured for the given user
    let featuredAssetsCount = await UserCollectionAssetModel.count({ where: { userId: user.id, isFeatured: true } });
    // If the current asset is featured the minus the current asset to avoid the featured asset removal process
    if (asset.isFeatured) featuredAssetsCount -= 1;
    // Apply limit based on the user collection type
    const collectionType = await getCollectionTypeOfUser(user.id);
    const featuredLimit = collectionType === 'IMAGE' ? maxAssetLimit || defaultFeaturedAssetsLimit : maxVideoLimit || defaultFeaturedVideosLimit;
    // Throw the limit error
    if (featuredAssetsCount >= featuredLimit) throw new ApiError('FEATURE_LIMIT_EXCEEDED', BAD_REQUEST);

    await asset.update({ isFeatured: !asset.isFeatured });

    return sendSuccessResponse(res, 'FEATURED_SUCCESS', OK, asset);
  } catch (error) {
    defaultLogger(`Error while make-featured-image: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = makeImageFeatured;
