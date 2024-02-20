const Sequelize = require('sequelize');

const { FREELANCER } = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const { getTransactionDetailsForFreelancerTrainingFees } = require('../functions/create-freelancer-training-fees-transaction-data-parser');
const transactionLogger = require('../transaction-logger');

const freelancerTrainingFees = async (_, args, ctx) => {
  let transaction;
  try {
    const { localeService } = ctx;
    const { data } = args;
    const { freelancerId } = data;
    const { User: UserModel, Transaction: TransactionModel } = ctx.models;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const getFreelancerInstance = await UserModel.findByPk(freelancerId, {
      attributes: ['role', 'accountDeletedAt'],
    });

    if (!getFreelancerInstance || getFreelancerInstance.role !== FREELANCER || getFreelancerInstance.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }

    const trainingFeesTransactionData = await getTransactionDetailsForFreelancerTrainingFees(data, ctx);

    await TransactionModel.create(trainingFeesTransactionData, { transaction });

    await transaction.commit();

    const response = {
      message: getMessage('TRANSACTION_DONE_SUCCESSFULLY', localeService),
      status: 'SUCCESS',
    };

    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    transactionLogger(`Error while create transaction for freelancer trining fees: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = freelancerTrainingFees;
