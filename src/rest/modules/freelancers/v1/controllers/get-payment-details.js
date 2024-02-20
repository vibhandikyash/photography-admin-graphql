const {
  models:
  {
    Transaction: TransactionModel,
  },
} = require('../../../../../sequelize-client');

const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const { ApiError } = require('../../../../services/custom-api-error');
const { BAD_REQUEST, OK } = require('../../../../services/http-status-codes');
const dataBreakdownForTransactionTypes = require('../../../../services/transactions/data-breakdown-for-transaction-types');
const freelancersLogger = require('../../freelancers-logger');

const getPaymentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transactionInstance = await TransactionModel.findByPk(id, { attributes: ['eventId', 'transactionType'] });

    if (!transactionInstance) {
      throw new ApiError(getMessage('TRANSACTION_NOT_FOUND'), BAD_REQUEST);
    }

    const { transactionType, eventId } = transactionInstance;

    const response = await dataBreakdownForTransactionTypes(transactionType, eventId);

    return sendSuccessResponse(res, 'SUCCESS', OK, response);
  } catch (error) {
    freelancersLogger(`Error in getting-payment-details: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getPaymentDetails;
