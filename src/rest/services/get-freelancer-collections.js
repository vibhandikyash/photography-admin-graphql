
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const defaultLogger = require('../../logger');

const {
  models: {
    UserCollection: UserCollectionModel,
    UserCollectionAsset: UserCollectionAssetModel,
  },
} = require('../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../shared-lib/aws/functions/generate-url-for-keys');
const validateUUID = require('../../utils/validate-uuid');

async function getAllCollections(userId) {
  const response = await UserCollectionModel.findAll({
    where: {
      userId,
    },
    attributes: ['id', 'name', 'type'],
    include: [{
      model: UserCollectionAssetModel,
      as: 'collectionAssets',
      attributes: ['id', 'url', 'title', 'isFeatured'],
    },
    ],
  });

  for (const collection of response) {
    for (const asset of collection.collectionAssets) {
      [asset.url] = asset.url ? await getKeysAndGenerateUrl([asset.url]) : null;
    }
  }

  return response;
}

async function getOneCollection(userId, collectionId) {
  try {
    if (!validateUUID(collectionId)) return false;

    const response = await UserCollectionModel.findOne({
      where: {
        id: collectionId, userId,
      },
      attributes: ['id', 'name', 'type'],
      include: [{
        model: UserCollectionAssetModel,
        as: 'collectionAssets',
        attributes: ['id', 'url', 'title', 'isFeatured'],
      },
      ],
    });

    for (const asset of response.collectionAssets) {
      [asset.url] = asset.url ? await getKeysAndGenerateUrl([asset.url]) : null;
    }

    return response ?? false;
  } catch (error) {
    defaultLogger(`Error while getOneCollection in get-freelancer-collections: ${error.message}`, null, 'error');
    throw error;
  }
}

const getFreelancerCollections = async (userId, collectionId) => {
  try {
    if (!userId) return false; // If no userId provided, return false
    let response;
    if (collectionId !== '') {
      response = await await getOneCollection(userId, collectionId);
    } else {
      response = await getAllCollections(userId);
    }

    return response;
  } catch (error) {
    defaultLogger(`Error while getActiveFreelancer in get-freelancer-collections: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getFreelancerCollections;
