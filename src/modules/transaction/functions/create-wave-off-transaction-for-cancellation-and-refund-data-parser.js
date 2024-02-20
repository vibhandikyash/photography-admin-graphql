const { isNaN } = require('lodash');

const {
  CONFIGURATION_KEYS: { CONVENIENCE_FEES }, TRANSACTION_COMPLETED, WAIVE_OFF, CANCELLATION_CHARGES,
} = require('../../../constants/service-constants');
const getRecruiterAvailableBalance = require('../queries/get-recruiter-available-balance');
const transactionLogger = require('../transaction-logger');

const getTransactionDetailsForWaiveOffCharges = async (transactionDetails, recruiterDetails, ctx) => {
  try {
    const {
      amount, modeOfPayment, note, eventId, transactionType, waiveOffType,
    } = transactionDetails;
    const recruiterObj = {};
    const { id: recruiterId } = recruiterDetails;
    const transactionDataObj = {
      amount,
      modeOfTransaction: modeOfPayment,
      note,
      userId: recruiterId,
      eventId,
      transactionStatus: TRANSACTION_COMPLETED,
    };

    let { totalBalance: recruiterCurrentBalance } = await getRecruiterAvailableBalance(null, { recruiterId }, ctx);
    recruiterCurrentBalance = isNaN(recruiterCurrentBalance) ? 0 : recruiterCurrentBalance;
    recruiterCurrentBalance += amount;

    if (transactionType === WAIVE_OFF) {
      if (waiveOffType === CANCELLATION_CHARGES) {
        transactionDataObj.transactionType = WAIVE_OFF;
        transactionDataObj.transactionSubType = CANCELLATION_CHARGES;
        recruiterObj.totalBalance = recruiterCurrentBalance;
        transactionDataObj.closingBalance = recruiterCurrentBalance;
      }
      if (waiveOffType === CONVENIENCE_FEES) {
        transactionDataObj.transactionType = WAIVE_OFF;
        transactionDataObj.transactionSubType = CONVENIENCE_FEES;
        recruiterObj.totalBalance = recruiterCurrentBalance;
        transactionDataObj.closingBalance = recruiterCurrentBalance;
      }
    }

    const recruiterWhere = {
      userId: recruiterId,
    };

    return [recruiterObj, recruiterWhere, transactionDataObj];
  } catch (error) {
    transactionLogger(`Error while get transaction details for waiveoff cancellation or convenience: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = { getTransactionDetailsForWaiveOffCharges };
