const { get, isNaN } = require('lodash');

const { TOP_UP, COMPLETED } = require('../../../constants/service-constants');

const getRecruiterAvailableBalance = require('../queries/get-recruiter-available-balance');
const transactionLogger = require('../transaction-logger');

const getNewTransactionDetailsForTopUp = async (transactionDetails, recruiterDetails, transactionGroupId, ctx) => {
  try {
    const recruiterId = get(recruiterDetails, 'id');
    const { modeOfPayment, note } = transactionDetails;
    const { amount } = transactionDetails;

    const { totalBalance: recruiterCurrentBalance } = await getRecruiterAvailableBalance(null, { recruiterId }, ctx);
    const closingBalance = isNaN(recruiterCurrentBalance) ? 0 + amount : recruiterCurrentBalance + amount;

    const recruiterTopUpObj = {
      userId: recruiterId,
      amount,
      modeOfTransaction: modeOfPayment,
      transactionType: TOP_UP,
      transactionStatus: COMPLETED,
      groupId: transactionGroupId,
      note,
      closingBalance,
    };

    return [recruiterTopUpObj, closingBalance];
  } catch (error) {
    transactionLogger(`Error while getNewTransactionDetailsForTopUp: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getNewTransactionDetailsForTopUp;
