const transactionLogger = require('../transaction-logger');

const getTransactionTypeList = (_, args, ctx) => {
  try {
    const transactionTypes = ['BOOKING_FEES', 'INITIAL_FEES', 'TOP_UP',
      'REFUND', 'WAIVE_OFF', 'CONVENIENCE_FEES', 'TRAINING_FEES'];

    return transactionTypes;
  } catch (error) {
    transactionLogger(`Error while feting transaction type list: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getTransactionTypeList;
