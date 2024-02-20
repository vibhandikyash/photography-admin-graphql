const defaultLogger = require('../../../../../logger');
const {
  models:
  {
    UserCollection: UserCollectionModel,
    UserCollectionAsset: UserCollectionAssetModel,
  },
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const getCollectionTypeOfUser = require('../../../../../utils/get-collection-type');
const { ApiError } = require('../../../../services/custom-api-error');
const { UNAUTHENTICATED } = require('../../../../services/http-status-codes');

const getFreelancersAllVideos = async (req, res, next) => {
  try {
    const { id: userId } = req.params;

    // Check the user's collection type ( image collection type not allowed to upload videos )
    const collectionType = await getCollectionTypeOfUser(userId);
    if (collectionType === 'IMAGE') throw new ApiError('UNAUTHORIZED', UNAUTHENTICATED);

    const attributes = ['id', 'name', 'type'];

    const collection = await UserCollectionModel.findAll(
      {
        where: { userId },
        include: [
          {
            model: UserCollectionAssetModel,
            as: 'collectionAssets',
            attributes: ['id', 'title', 'url', 'isFeatured'],
          },
        ],
        order: [
          ['createdAt', 'ASC'],
        ],
        attributes,
      },
    );

    return sendSuccessResponse(res, 'SUCCESS', 200, collection);
  } catch (error) {
    defaultLogger(`Error in freelancers get-videos: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getFreelancersAllVideos;
