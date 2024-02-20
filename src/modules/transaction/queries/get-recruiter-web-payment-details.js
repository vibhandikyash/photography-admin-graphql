const dataBreakdownForTransactionTypes = require('../../../rest/services/transactions/data-breakdown-for-transaction-types');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const transactionLogger = require('../transaction-logger');

const getRecruiterWebPaymentDetails = async (_, args, ctx) => {
  try {
    const { models: { Transaction: TransactionModel }, localeService } = ctx;
    const { where: { id } } = args;

    const transactionInstance = await TransactionModel.findByPk(id, { attributes: ['eventId', 'transactionType'] });

    if (!transactionInstance) {
      throw new CustomApolloError(getMessage('TRANSACTION_NOT_FOUND', localeService));
    }

    const { transactionType, eventId } = transactionInstance;

    const response = await dataBreakdownForTransactionTypes(transactionType, eventId);
    response.type = transactionType;
    return response;
  } catch (error) {
    transactionLogger(`Error from getRecruiterWebPaymentDetails: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterWebPaymentDetails;
