const { v4: UUID } = require('uuid');

const { TRAINING_FEES, TRANSACTION_COMPLETED, WEDLANCER } = require('../../../constants/service-constants');
const transactionLogger = require('../transaction-logger');

const getTransactionDetailsForFreelancerTrainingFees = async (freelancerData = {}, ctx) => {
  try {
    const {
      freelancerId, transactionType, modeOfPayment, amount, note,
    } = freelancerData;
    const trainingFeesDetails = {
      userId: freelancerId,
      transactionType: transactionType && transactionType === TRAINING_FEES ? transactionType : TRAINING_FEES,
      transactionStatus: TRANSACTION_COMPLETED,
      groupId: UUID(),
      modeOfTransaction: modeOfPayment,
      tag: WEDLANCER,
      amount,
      note,
    };

    return trainingFeesDetails;
  } catch (error) {
    transactionLogger(`Error while getTransactionDetailsForFreelancerTrainingFees: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = { getTransactionDetailsForFreelancerTrainingFees };
