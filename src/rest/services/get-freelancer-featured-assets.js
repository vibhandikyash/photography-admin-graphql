const { values } = require('lodash');

const { defaultFeaturedAssetsLimit, defaultFeaturedVideosLimit } = require('../../constants/constants');

const { CONFIGURATION_KEYS: { MAX_FEATURED_ASSETS, MAX_FEATURED_VIDEO } } = require('../../constants/service-constants');

const defaultLogger = require('../../logger');
const {
  Sequelize, sequelize,
} = require('../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../shared-lib/aws/functions/generate-url-for-keys');
const { getConfigByKey } = require('../../shared-lib/configurations');
const getCollectionTypeOfUser = require('../../utils/get-collection-type');

const getFreelancerFeaturedAssetsService = async (userId, assetsLimit = 0) => {
  try {
    const collectionType = await getCollectionTypeOfUser(userId);
    let limit;
    if (!assetsLimit) {
      const [maxAssetLimit, maxVideoLimit] = await getConfigByKey([MAX_FEATURED_ASSETS, MAX_FEATURED_VIDEO]);
      limit = collectionType === 'IMAGE' ? maxAssetLimit || defaultFeaturedAssetsLimit : maxVideoLimit || defaultFeaturedVideosLimit;
    } else {
      limit = assetsLimit;
    }

    const sqlDataQuery = `select uca.id, uca.title, uca.url, uca.is_featured as "isFeatured" from user_collection_assets uca where uca.user_id = :userId
    and (uca.is_featured = true and uca.deleted_at is null)  order by uca.is_featured asc, uca.created_at asc limit :limit`;
    const replacements = { userId, limit };
    let assets = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    if (assets.length < limit) {
      const assetIds = assets.map(e => e.id);

      // Prepare the Ids to include in the not-in query, if there no ids are present then took user id because its necessary to add any UuId in not-in query
      const ids = !assetIds.length ? `'${userId}'` : `'${assetIds.join('\',\'')}'`; // Array to string conversion with quoted and comma separated

      limit -= assets.length; // Set the limit to remaining after the featured assets

      const newSqlDataQuery = `select uca.id, uca.title, uca.url, uca.is_featured as "isFeatured" from user_collection_assets uca where uca.user_id = :userId
       and (uca.id not in (${ids}) and uca.deleted_at is null)  order by random() limit :limit`;
      const newReplacements = { userId, limit };

      const newAssetsDetails = await sequelize.query(newSqlDataQuery, { replacements: newReplacements, type: Sequelize.QueryTypes.SELECT });

      if (newAssetsDetails.length) {
        assets = assets.concat(newAssetsDetails);
      }
    }

    let response;
    if (collectionType === 'IMAGE') {
      response = JSON.parse(JSON.stringify(assets));

      /* eslint-disable no-await-in-loop */
      /* eslint-disable no-restricted-syntax */
      for (const asset of response) {
        asset.url = asset.url ? values(await getKeysAndGenerateUrl([asset.url]))[0] : null;
      }
    } else {
      response = assets;
    }

    return response;
  } catch (error) {
    defaultLogger(`Error in get-freelancer-featured-assets: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getFreelancerFeaturedAssetsService;
