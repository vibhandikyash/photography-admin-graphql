/* eslint-disable prefer-const */
const { get } = require('lodash');

const {
  models:
  {
    Transaction: TransactionModel,
    UserBusiness: UserBusinessModel,
    User: UserModel,
  },
} = require('../../../../../sequelize-client');

const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const { ApiError } = require('../../../../services/custom-api-error');
const { BAD_REQUEST, OK } = require('../../../../services/http-status-codes');
const dataBreakdownForTransactionTypes = require('../../../../services/transactions/data-breakdown-for-transaction-types');
const eventLogger = require('../../../events/event-logger');

const getPaymentDetails = async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const transactionInstance = await TransactionModel.findByPk(id, { attributes: ['eventId', 'transactionType'] });

    if (!transactionInstance) {
      throw new ApiError(getMessage('TRANSACTION_NOT_FOUND'), BAD_REQUEST);
    }

    const userInstance = await UserModel.findByPk(user.id,
      {
        include: [
          {
            model: UserBusinessModel,
            as: 'business',
            attributes: ['totalBalance'],
          },
        ],
      });

    const result = {
      totalBalance: get(userInstance.business, 'totalBalance', '{}'),
    };

    if (!result) {
      throw new ApiError(getMessage('NO_TRANSACTION_FOUND'), BAD_REQUEST);
    }
    const { transactionType, eventId } = transactionInstance;

    const response = await dataBreakdownForTransactionTypes(transactionType, eventId);

    return sendSuccessResponse(res, 'SUCCESS', OK, response);
  } catch (error) {
    eventLogger(`Error in getting-payment-details: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getPaymentDetails;
