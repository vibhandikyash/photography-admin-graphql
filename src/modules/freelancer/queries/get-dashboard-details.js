const { sumBy } = require('lodash');

const { EVENT_FEES, COMPLETED } = require('../../../constants/service-constants');
const freelancerLogger = require('../freelancer-logger');

const getDashboardDetails = async (_, args, ctx) => {
  try {
    const { models: { Transaction: TransactionModel }, req: { user: { id: userId } } } = ctx;
    const transactions = await TransactionModel.findAll({ where: { userId, transactionType: EVENT_FEES, transactionStatus: COMPLETED } });

    const totalAmount = sumBy(transactions, 'amount');
    const response = { amount: totalAmount, projectsCompleted: transactions.length };
    return response;
  } catch (error) {
    freelancerLogger(`Error from get dashboard details for web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getDashboardDetails;
