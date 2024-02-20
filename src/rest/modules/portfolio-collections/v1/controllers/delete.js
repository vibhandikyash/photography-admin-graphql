
const defaultLogger = require('../../../../../logger');
const {
  models:
  { UserCollection: UserCollectionModel, UserCollectionAsset: UserCollectionAssetModel }, sequelize, Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const { INVALID_INPUT, NOT_FOUND, OK } = require('../../../../services/http-status-codes');

const deleteCollection = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const { id: collectionId } = req.params;
    // Validate the request UUID
    const isValidUUID = await validateUUID(collectionId);
    if (!isValidUUID) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    const { user } = req;

    const existingCollection = await UserCollectionModel.findByPk(collectionId);

    if (!existingCollection) throw new ApiError('COLLECTION_NOT_FOUND', NOT_FOUND);

    await UserCollectionModel.destroy({ where: { userId: user.id, id: collectionId }, transaction });

    await UserCollectionAssetModel.destroy({ where: { collectionId }, transaction });

    await transaction.commit();

    return sendSuccessResponse(res, 'COLLECTION_REMOVED', OK);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    defaultLogger(`Error while delete collection: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = deleteCollection;
