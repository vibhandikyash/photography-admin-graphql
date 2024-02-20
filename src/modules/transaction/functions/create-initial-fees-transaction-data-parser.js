const { get } = require('lodash');

const {
  CONFIGURATION_KEYS: { INITIAL_REGISTRATION_FEES }, WEDLANCER, INITIAL_FEES, COMPLETED,
} = require('../../../constants/service-constants');
const { getConfigByKey } = require('../../../shared-lib/configurations/index');
const transactionLogger = require('../transaction-logger');

const getInitialTransactionDetails = async (recruiterDetails, transactionGroupId, ctx) => {
  try {
    const recruiterId = get(recruiterDetails, 'id');
    const [registrationFees] = await getConfigByKey([INITIAL_REGISTRATION_FEES]);

    const initialTransactionObj = {
      userId: recruiterId,
      amount: registrationFees,
      tag: WEDLANCER,
      transactionType: INITIAL_FEES,
      transactionStatus: COMPLETED,
      groupId: transactionGroupId,
    };

    return initialTransactionObj;
  } catch (error) {
    transactionLogger(`Error while getInitialTransactionDetails: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getInitialTransactionDetails;
