/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const {
  pick, map, uniq, difference,
} = require('lodash');

const { IMAGE, VIDEO, SUCCESS } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  models: { UserCollection: FreelancerCollectionModel, UserCollectionAsset: FreelancerCollectionAssetsModel },
} = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const removeOriginFromUrl = require('../../../utils/remove-origin-from-url');

const updateFreelancerPortfolioCollectionService = async (data, userId, loggedInUserId, collectionId, localeService) => {
  try {
    const collectionInstance = await FreelancerCollectionModel.findByPk(collectionId);
    if (!collectionInstance) {
      throw new CustomApolloError(getMessage('COLLECTION_NOT_FOUND', localeService));
    }

    const COLLECTION = ['name'];
    const COLLECTION_ASSETS = ['url', 'title', 'isFeatured'];

    const freelancerCollection = pick(data, COLLECTION);
    const { collectionAssets: freelancerCollectionAssets } = data;
    const existingCollectionAssetsUrls = await FreelancerCollectionAssetsModel.findAll({ where: { collectionId } });

    const existingAssetsUrls = map(existingCollectionAssetsUrls, 'url');
    const requestAssetsUrls = map(freelancerCollectionAssets, 'url');

    // request url triming
    const requestUrlsData = [];
    requestAssetsUrls.forEach((requestUrl => {
      requestUrlsData.push(requestUrl && collectionInstance.type === IMAGE
        ? removeOriginFromUrl(requestUrl) : requestUrl);
    }));

    const insertAssetsArray = [];

    if (freelancerCollection) {
      await FreelancerCollectionModel.update(freelancerCollection, { where: { id: collectionId } });
    }
    if (freelancerCollectionAssets) {
      const assetsToAdd = uniq(difference(requestUrlsData, existingAssetsUrls));
      const assetsToRemove = uniq(difference(existingAssetsUrls, requestUrlsData));
      const getRequestAssetsToAdd = freelancerCollectionAssets.filter(value => assetsToAdd.includes(value.url));

      // check assets limit
      if (existingAssetsUrls.length + assetsToAdd.length - assetsToRemove.length > 20) {
        throw new CustomApolloError(getMessage('COLLECTION_ASSETS_LIMIT_EXCEEDED', localeService));
      }

      getRequestAssetsToAdd.forEach(collection => {
        const collectionAssets = pick(collection, COLLECTION_ASSETS);
        collectionAssets.url = collectionAssets.url && collectionInstance.type === IMAGE
          ? removeOriginFromUrl(collectionAssets.url) : collectionAssets.url;
        if (collectionInstance.type === VIDEO) {
          collectionAssets.title = freelancerCollection.name;
        }
        collectionAssets.collectionId = collectionId;
        collectionAssets.updatedBy = loggedInUserId;
        collectionAssets.userId = userId;
        insertAssetsArray.push(collectionAssets);
      });

      if (insertAssetsArray.length) {
        await FreelancerCollectionAssetsModel.bulkCreate(insertAssetsArray);
      }

      await FreelancerCollectionAssetsModel.destroy({ where: { collectionId, url: assetsToRemove } });

      // update the collection assets for isFeatured tag
      for (const asset of freelancerCollectionAssets) {
        if (asset.id) {
          const updateAssetsData = pick(asset, COLLECTION_ASSETS);
          updateAssetsData.url = updateAssetsData.url && collectionInstance.type === IMAGE
            ? removeOriginFromUrl(updateAssetsData.url) : updateAssetsData.url;
          await FreelancerCollectionAssetsModel.update(updateAssetsData, { where: { id: asset.id } });
        }
      }
    }
    const response = {
      status: SUCCESS,
      message: getMessage('COLLECTION_UPDATED', localeService),
    };
    return response;
  } catch (error) {
    defaultLogger(`Error from updating freelancer portfolio collection service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = updateFreelancerPortfolioCollectionService;
