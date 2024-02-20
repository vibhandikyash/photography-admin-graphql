const { get } = require('lodash');
const Sequelize = require('sequelize');

const { v4: UUID } = require('uuid');

const {
  RECRUITER, PAID_KEY,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const getNewTransactionDetailsForTopUp = require('../functions/create-top-up-for-recruiter-data-parser');
const transactionLogger = require('../transaction-logger');

const createTopUpForRecruiter = async (_, args, ctx) => {
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
          model: UserProfileModel,
          as: 'profile',
          attributes: ['userId', 'typeKey'],
        },
      ],
      attributes: { exclude: ['password', 'refreshToken', 'otp', 'otpExpiry', 'otpRequestAttempts', 'otpWrongAttempts'] },
    });

    if (!getRecruiterInstance) {
      throw new CustomApolloError(getMessage('RECRUITER_NOT_FOUND', localeService));
    }
    const recruiterProfile = get(getRecruiterInstance, 'profile.typeKey', 'NON_PAID');

    if (getRecruiterInstance && recruiterProfile !== PAID_KEY) {
      throw new CustomApolloError(getMessage('RECRUITER_MUST_BE_TYPE_PAID', localeService));
    }

    const transactionGroupId = UUID();

    const [recruiterTopUpData, recruiterUpdatedBalance] = await getNewTransactionDetailsForTopUp(data,
      getRecruiterInstance, transactionGroupId, ctx);
    await UserBusinessModel.update({ totalBalance: recruiterUpdatedBalance }, {
      where: {
        userId: getRecruiterInstance.id,
      },
      transaction,
    });
    await TransactionModel.create(recruiterTopUpData, { transaction });

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
    transactionLogger(`Error while create topUp payment for recruiter: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createTopUpForRecruiter;
