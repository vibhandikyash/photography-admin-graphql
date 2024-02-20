const moment = require('moment');

const {
  PENDING, APPROVED, SUCCESS, REGULARIZE_REQUEST_TYPES: { INSUFFICIENT_HOURS }, REGULARIZE_REQUEST_UPDATE_STATUS_VALIDITY_IN_HOURS,
} = require('../../../constants/service-constants');
const updateTransactionOnRequestApproval = require('../../../rest/services/regularizations/update-transaction-on-request-approval');
const { sequelize, Sequelize } = require('../../../sequelize-client');
// eslint-disable-next-line max-len
const sendEmailToFreelancerForRegularizeRequestApproved = require('../../../shared-lib/emails/regularise/send-email-to-freelancer-for-regularize-request-approved');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const regularizationLogger = require('../regularization-logger');

const updateInsufficientRequestStatus = async (_, args, ctx) => {
  let transaction;
  try {
    const { models: { RegularizeRequest: RegularizeRequestModel }, localeService } = ctx;
    const { where: { id: requestId }, data: { status } } = args;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const existingRequest = await RegularizeRequestModel.findByPk(requestId);
    if (!existingRequest || existingRequest.status !== PENDING || existingRequest.requestType !== INSUFFICIENT_HOURS) {
      throw new CustomApolloError(getMessage('INSUFFICIENT_HOURS_REQUEST_NOT_FOUND'), localeService);
    }
    const {
      userId: freelancerId, eventId, requestType, createdAt,
    } = existingRequest;
    const statusUpdateHoursDiff = moment().diff(createdAt, 'hours');
    if (statusUpdateHoursDiff > REGULARIZE_REQUEST_UPDATE_STATUS_VALIDITY_IN_HOURS) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_UPDATE_STATUS', localeService, {
        requestApprovalValidity: REGULARIZE_REQUEST_UPDATE_STATUS_VALIDITY_IN_HOURS,
      }));
    }
    let metaDataToBeUpdated;
    if (status === APPROVED) {
      // DEDUCT THE EVENT FEES AND UPDATE THE STATUS
      metaDataToBeUpdated = await updateTransactionOnRequestApproval(ctx, eventId, freelancerId, requestId, requestType, false, transaction);

      // SEND EMAIL FOR INSUFFICIENT HOURS REQUEST APPROVED
      sendEmailToFreelancerForRegularizeRequestApproved(requestId, true);
    }

    await RegularizeRequestModel.update({ status, metaData: metaDataToBeUpdated }, { where: { id: requestId } }, { transaction });
    await transaction.commit();
    const response = { status: SUCCESS, message: getMessage('INSUFFICIENT_HOURS_REQUEST_STATUS_UPDATED', localeService) };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    regularizationLogger(`Error from update insufficient hours status, ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateInsufficientRequestStatus;
