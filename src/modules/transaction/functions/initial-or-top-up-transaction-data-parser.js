const { isNaN } = require('lodash');

const {
  COMPLETED, INITIAL_FEES, TOP_UP,
} = require('../../../constants/service-constants');
const transactionLogger = require('../transaction-logger');

const getNewTransactionForInitialOrTopUp = async (transactionDetails, recruiterDetails, ctx) => {
  try {
    const recruiterObj = {};
    const registrationFees = 499;
    const {
      amount, modeOfPayment, note, transactionType,
    } = transactionDetails;

    const { id, business: { totalBalance } } = recruiterDetails;
    const transactionDataObj = {
      amount,
      modeOfPayment,
      note,
      userId: id,
      transactionStatus: COMPLETED,
    };

    let recruiterCurrentBalance = totalBalance && isNaN(totalBalance) ? 0 : totalBalance;
    recruiterCurrentBalance += amount;

    if (transactionType === INITIAL_FEES) {
      transactionDataObj.transactionType = INITIAL_FEES;
      transactionDataObj.amount += registrationFees;
      recruiterObj.totalBalance = recruiterCurrentBalance;
      transactionDataObj.closingBalance = transactionDataObj.amount;
    }
    if (transactionType === TOP_UP) {
      transactionDataObj.transactionType = TOP_UP;
      recruiterObj.totalBalance = recruiterCurrentBalance;
      transactionDataObj.closingBalance = recruiterCurrentBalance;
    }
    const recruiterWhere = {
      userId: id,
    };

    return [recruiterObj, recruiterWhere, transactionDataObj];
  } catch (error) {
    transactionLogger(`Error while get details initial payment or topUp payment: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = { getNewTransactionForInitialOrTopUp };
