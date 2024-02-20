const { validationResult } = require('express-validator');
const moment = require('moment');

const defaultLogger = require('../../../../../logger');
const {
  models:
   {
     UserCollection: UserCollectionModel,
     UserCollectionAsset: UserCollectionAssetModel,
   }, sequelize, Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');

const deleteFiles = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, 422);
    }

    const { user } = req;
    const { files } = req.body;
    const { id: collectionId } = req.params;

    // Files parameters are null then delete all assets
    if (!files.length) {
      await UserCollectionAssetModel.destroy({ where: { userId: user.id, collectionId } });
      return sendSuccessResponse(res, 'FILE_DELETE_SUCCESS', 200);
    }

    // Validate the assetsId
    let isContainInvalidId = false;
    await files.forEach(async assetId => {
      if (!validateUUID(assetId)) {
        isContainInvalidId = true;
      }
    });
    if (isContainInvalidId) throw new ApiError('INVALID_INPUT', 422);

    // validate collection us exists or not
    const collection = await UserCollectionModel.findOne({ where: { id: collectionId, userId: user.id } });
    if (!collection) throw new ApiError('COLLECTION_NOT_FOUND', 404);

    const assetsId = files.join('\',\'');

    // const promiseArr = [];
    /* eslint-disable */
    //for (const fileId of files) {
    //  promiseArr.push(
    //    UserCollectionAssetModel.destroy({ where: { id: fileId, userId: user.id, collectionId }, transaction }),
    //  );
    //}
    /* eslint-enable */

    // await Promise.all(promiseArr);

    // Delete all assets except the provided assets
    const sqlData = `UPDATE public.user_collection_assets
     SET deleted_at='${moment().toISOString()}'
     WHERE id not in ('${assetsId}')
     AND user_id='${user.id}'
     AND collection_id='${collectionId}'`;

    await sequelize.query(sqlData, { transaction });

    await transaction.commit();
    return sendSuccessResponse(res, 'FILE_DELETE_SUCCESS', 200);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    defaultLogger(`Error while deleteFiles: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = deleteFiles;
