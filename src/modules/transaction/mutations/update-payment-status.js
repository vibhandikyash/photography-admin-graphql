const Sequelize = require('sequelize');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const { getTransactionDataToBeUpdateForUpdateStatus } = require('../functions/update-payment-status-data-parser');
const transactionLogger = require('../transaction-logger');

const updatePaymentStatus = async (_, args, ctx) => {
  let transaction;
  try {
    const { localeService } = ctx;
    // const { user } = ctx.req;
    const { data } = args;
    const {
      Transaction: TransactionModel,
    } = ctx.models;
    const { transactionId: id, transactionStatus } = data;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const transactionInstance = await TransactionModel.findByPk(id);

    if (!transactionInstance) {
      throw new CustomApolloError(getMessage('TRANSACTION_NOT_FOUND', localeService));
    }

    const [where, dataToBeUpdate] = getTransactionDataToBeUpdateForUpdateStatus(transactionInstance.id, transactionStatus);

    await TransactionModel.update(dataToBeUpdate, { where }, transaction);

    await transaction.commit();

    const response = {
      message: getMessage('TRANSACTION_STATUS_UPDATED_SUCCESSFULLY', localeService),
      status: 'SUCCESS',
    };

    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    transactionLogger(`Error while update transaction status : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updatePaymentStatus;

