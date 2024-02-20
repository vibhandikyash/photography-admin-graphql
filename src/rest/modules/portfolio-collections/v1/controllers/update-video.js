
const { validationResult } = require('express-validator');

const defaultLogger = require('../../../../../logger');
const {
  models:
  {
    UserCollection: UserCollectionModel,
    UserCollectionAsset: UserCollectionAssetModel,
  },
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const getCollectionTypeOfUser = require('../../../../../utils/get-collection-type');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  INVALID_INPUT, VALIDATION_FAILED, UNAUTHENTICATED, NOT_FOUND, OK,
} = require('../../../../services/http-status-codes');

const updateVideo = async (req, res, next) => {
  try {
    // Validate the request UUID
    const isValidUUID = validateUUID(req.params.id);
    if (!isValidUUID) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }

    const { title, url } = req.body;
    const { user } = req;

    const { id } = req.params;
    // Check the user's collection type ( image collection type not allowed to upload videos )
    const collectionType = await getCollectionTypeOfUser(user.id);
    if (collectionType === 'IMAGE') throw new ApiError('UNAUTHORIZED', UNAUTHENTICATED);

    const attributes = ['id', 'title', 'url', 'isFeatured'];
    const existingCollection = await UserCollectionModel.findByPk(id, { attributes: ['id', 'name', 'type'] });

    if (!existingCollection) throw new ApiError('COLLECTION_NOT_FOUND', NOT_FOUND);
    const asset = await UserCollectionAssetModel.findOne({
      where: { userId: user.id, collectionId: id },
      attributes,
    });

    if (!asset) throw new ApiError('VIDEO_NOT_FOUND', NOT_FOUND);

    let updatedCollection = await existingCollection.update({ name: title });
    const updatedAsset = await asset.update({ title, url });

    updatedCollection = JSON.parse(JSON.stringify(updatedCollection));
    const assetsData = JSON.parse(JSON.stringify(updatedAsset));

    updatedCollection.collectionAssets = [assetsData];

    return sendSuccessResponse(res, 'SUCCESS', OK, updatedCollection);
  } catch (error) {
    defaultLogger(`Error while update-video  ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = updateVideo;
