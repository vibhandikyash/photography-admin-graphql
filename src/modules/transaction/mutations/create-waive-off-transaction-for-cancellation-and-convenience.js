/* eslint-disable no-use-before-define */
const Sequelize = require('sequelize');

const {
  RECRUITER, TRANSACTION_COMPLETED, PAID_KEY,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const { getTransactionDetailsForWaiveOffCharges } = require('../functions/create-wave-off-transaction-for-cancellation-and-refund-data-parser');
const transactionLogger = require('../transaction-logger');

const waiveOffTransactionForCancellationAndConvenienceFees = async (_, args, ctx) => {
  let transaction;
  try {
    const { localeService } = ctx;
    const { data } = args;
    const { eventId, waiveOffType } = data;
    const {
      User: UserModel, UserProfile: UserProfileModel, UserBusiness: UserBusinessModel, Transaction: TransactionModel, Event: EventModel,
    } = ctx.models;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const eventInstance = await EventModel.findOne({
      where: {
        id: eventId,
      },
      attributes: ['id', 'recruiterId'],
      include: [{
        model: TransactionModel,
        as: 'transactions',
        where: {
          transactionType: waiveOffType,
          transactionStatus: TRANSACTION_COMPLETED,
        },
      }],
    });

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    if (!eventInstance.transactions) {
      throw new CustomApolloError(getMessage('TRANSACTION_NOT_FOUND', localeService));
    }

    const getRecruiterInstance = await UserModel.findOne({
      where: {
        id: eventInstance?.recruiterId,
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

    const [recruiterData, recruiterWhere, transactionData] = await getTransactionDetailsForWaiveOffCharges(data, getRecruiterInstance, ctx);

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
    transactionLogger(`Error while create transaction for waiveoff cancellation or convenience: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = waiveOffTransactionForCancellationAndConvenienceFees;
