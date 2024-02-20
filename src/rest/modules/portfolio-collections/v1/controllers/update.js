
const { validationResult } = require('express-validator');

const defaultLogger = require('../../../../../logger');
const {
  models:
   { UserCollection: UserCollectionModel },
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');

const updateCollection = async (req, res, next) => {
  try {
    // Validate the request UUID
    const isValidUUID = await validateUUID(req.params.id);
    if (!isValidUUID) throw new ApiError('INVALID_INPUT', 422);

    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, 422);
    }

    const { name } = req.body;
    const { user } = req;
    const { id: collectionId } = req.params;

    const collection = await UserCollectionModel.findOne({
      where: { userId: user.id, id: collectionId },
      attributes: ['id', 'name'],
    });

    if (!collection) throw new ApiError('COLLECTION_NOT_FOUND', 404);

    await collection.update({ name });

    return sendSuccessResponse(res, 'COLLECTION_UPDATE_SUCCESS', 200, collection);
  } catch (error) {
    defaultLogger(`Error while updateCollection  ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = updateCollection;
