const Sequelize = require('sequelize');

const {
  RECRUITER, PAID_KEY,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const { getNewTransactionForInitialOrTopUp } = require('../functions/initial-or-top-up-transaction-data-parser');
const transactionLogger = require('../transaction-logger');
// NEED TO REMOVE THIS API
const initialPaymentAndTopUpByRecruiter = async (_, args, ctx) => {
  let transaction;
  try {
    const { localeService } = ctx;
    const { data } = args;
    const {
      User: UserModel,
      UserProfile: UserProfileModel,
      UserBusiness: UserBusinessModel,
      Transaction: TransactionModel,
    } = ctx.models;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const getRecruiterInstance = await UserModel.findOne({
      where: {
        id: data.recruiterId,
        role: RECRUITER,
        accountDeletedAt: null,
      },
      include: [
        {
          model: UserBusinessModel,
          as: 'business',
          attributes: ['userId', 'totalBalance'],
        },
      ],
      attributes: { exclude: ['password', 'refreshToken', 'otp', 'otpExpiry', 'otpRequestAttempts', 'otpWrongAttempts'] },
    });

    if (!getRecruiterInstance) {
      throw new CustomApolloError(getMessage('RECRUITER_NOT_FOUND', localeService));
    }
    const checkRecruiterTypeKey = await UserProfileModel.count({
      where: {
        userId: getRecruiterInstance.id,
        typeKey: PAID_KEY,
      },
    });

    if (!checkRecruiterTypeKey) {
      throw new CustomApolloError(getMessage('RECRUITER_MUST_BE_TYPE_PAID', localeService));
    }

    const [recruiterData, recruiterWhere, transactionData] = await getNewTransactionForInitialOrTopUp(data, getRecruiterInstance, ctx);

    await UserBusinessModel.update(recruiterData, {
      where: recruiterWhere,
    }, { transaction });

    await TransactionModel.create(transactionData, { transaction });

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
    transactionLogger(`Error while create initial payment or topup payment: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = initialPaymentAndTopUpByRecruiter;
