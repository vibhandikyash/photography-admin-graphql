const defaultLogger = require('../../../../../logger');
const {
  models:
   {
     UserCollectionAsset: UserCollectionAssetModel,
     UserCollection: UserCollectionModel,
   },
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const getCollectionTypeOfUser = require('../../../../../utils/get-collection-type');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  FORBIDDEN, NOT_FOUND, OK, INVALID_INPUT,
} = require('../../../../services/http-status-codes');

const getOneVideo = async (req, res, next) => {
  try {
    const { id: collectionId } = req.params;
    // Validate the request UUID
    const isValidUUID = validateUUID(collectionId);
    if (!isValidUUID) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    const { user } = req;

    // Check the user's collection type ( image collection type not allowed to upload videos )
    const collectionType = await getCollectionTypeOfUser(user.id);
    if (collectionType !== 'VIDEO') throw new ApiError('FORBIDDEN', FORBIDDEN);

    const collection = await UserCollectionModel.findOne({
      include: [
        {
          model: UserCollectionAssetModel,
          as: 'collectionAssets',
          attributes: ['id', 'title', 'url', 'isFeatured'],
        },
      ],
      where: { id: collectionId, userId: user.id, type: 'VIDEO' },
      order: [
        ['createdAt', 'ASC'],
      ],
      attributes: ['id', 'name', 'type'],
    });

    if (!collection) throw new ApiError('VIDEO_NOT_FOUND', NOT_FOUND);

    return sendSuccessResponse(res, 'SUCCESS', OK, collection);
  } catch (error) {
    defaultLogger(`Error while get-video: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getOneVideo;
