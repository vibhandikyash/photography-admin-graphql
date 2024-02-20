const { validationResult } = require('express-validator');

const defaultLogger = require('../../../../../logger');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const isUserCreateCollection = require('../../../../services/is-user-create-collection');

const createCollection = async (req, res, next) => {
  try {
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, 422);
    }

    const { name } = req.body;
    const { user } = req;

    const createCollectionAllow = await isUserCreateCollection(user.id);
    if (!createCollectionAllow) throw new ApiError('COLLECTION_LIMIT_EXCEEDED', 429);

    const collectionObj = await user.createCollection({ name });

    // Destructure collection object and return only used fields
    const collection = {
      id: collectionObj.id,
      name: collectionObj.name,
    };

    return sendSuccessResponse(res, 'COLLECTION_CREATE_SUCCESS', 201, collection);
  } catch (error) {
    defaultLogger(`Error while createCollection: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = createCollection;
