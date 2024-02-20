
const defaultLogger = require('../../../../../logger');
const {
  models:
   { UserCollectionAsset: UserCollectionAssetModel },
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const getCollectionTypeOfUser = require('../../../../../utils/get-collection-type');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');

const deleteVideo = async (req, res, next) => {
  try {
    // Validate the request UUID
    const isValidUUID = validateUUID(req.params.id);
    if (!isValidUUID) throw new ApiError('INVALID_INPUT', 422);

    const { user } = req;
    const { id: assetId } = req.params;

    // Check the user's collection type ( image collection type not allowed to upload videos )
    const collectionType = await getCollectionTypeOfUser(user.id);
    if (collectionType === 'IMAGE') throw new ApiError('UNAUTHORIZED', 401);

    const asset = await UserCollectionAssetModel.findOne({
      where: { userId: user.id, id: assetId },
    });

    if (!asset) throw new ApiError('VIDEO_NOT_FOUND', 404);

    await asset.destroy();

    return sendSuccessResponse(res, 'SUCCESS', 200);
  } catch (error) {
    defaultLogger(`Error while deleteVideo  ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = deleteVideo;
