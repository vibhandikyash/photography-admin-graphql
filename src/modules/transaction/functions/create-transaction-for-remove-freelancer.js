/* eslint-disable no-restricted-syntax */
const { isEmpty } = require('lodash');
const moment = require('moment');
const { Op } = require('sequelize');
const { v4: UUID } = require('uuid');

const {
  BOOKING_FEES, CONFIGURATION_KEYS: { CONVENIENCE_FEES }, EVENT_FEES, COMMISSION, CANCELLED, REFUND, MODE_OF_PAYMENT: { CASH },
  TRANSACTION_COMPLETED,
  TRANSACTION_PENDING,
} = require('../../../constants/service-constants');
const { getConfigByKey } = require('../../../shared-lib/configurations');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const getRecruiterAvailableBalance = require('../queries/get-recruiter-available-balance');
const transactionLogger = require('../transaction-logger');

const createTransactionForRemoveFreelancer = async (eventId, freelancerId, transaction, ctx) => {
  try {
    const {
      models: {
        EventFreelancer: EventFreelancerModel, Transaction: TransactionModel, UserBusiness: UserBusinessModel, Event: EventModel,
      }, localeService,
    } = ctx;
    let refundBookingAmountDetails = {};
    let refundConvenienceAmountDetails = {};

    const getEventInstance = await EventModel.findByPk(eventId, { transaction });

    if (!getEventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const { status } = getEventInstance;

    if (status === CANCELLED) {
      throw new CustomApolloError(getMessage('EVENT_ALREADY_CANCELLED', localeService));
    }

    const eventFreelancerDetails = await EventFreelancerModel.findOne({
      where: {
        eventId: getEventInstance.id,
        userId: freelancerId,
        isAssigned: true,
      },
      transaction,
    });

    if (!eventFreelancerDetails) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_ASSIGNED_TO_EVENT', localeService));
    }

    const [recruiterTransactionInstance, freelancerTransactionInstance, commissionFeesTransaction] = await Promise.all([
      // BOOKING_FEES and  CONVENIENCE_FEES of recruiter
      TransactionModel.findAll({
        where: {
          userId: getEventInstance.recruiterId,
          freelancerId: eventFreelancerDetails.userId,
          eventId: getEventInstance.id,
          transactionType: { [Op.in]: [BOOKING_FEES, CONVENIENCE_FEES] },
          transactionStatus: TRANSACTION_COMPLETED,
        },
        transaction,
      }),

      // EVENT_FEES of freelancer
      TransactionModel.findAll({
        where: {
          userId: eventFreelancerDetails.userId,
          eventId: getEventInstance.id,
          transactionType: { [Op.in]: [EVENT_FEES] },
          transactionStatus: TRANSACTION_PENDING,
        },
        transaction,
      }),

      // COMMISSION to wedlancer, 10% of freelancer event fees(subtract 10% from freelancer finalizedPrice)
      TransactionModel.findAll({
        where: {
          freelancerId, eventId, transactionType: COMMISSION, transactionStatus: TRANSACTION_COMPLETED,
        },
        transaction,
      }),
    ]);

    if (!recruiterTransactionInstance.length || !freelancerTransactionInstance.length || !commissionFeesTransaction.length) {
      throw new CustomApolloError(getMessage('TRANSACTION_NOT_FOUND', localeService));
    }

    // eslint-disable-next-line prefer-const
    let { startDate, endDate, recruiterId } = getEventInstance;
    startDate = moment(startDate);
    endDate = moment(endDate);
    const dayCount = endDate.diff(startDate, 'days') + 1;
    const [convenienceFees] = await getConfigByKey([CONVENIENCE_FEES]);

    const { totalBalance: recruiterTotalBalance } = await getRecruiterAvailableBalance(null, { recruiterId }, ctx);
    const { finalizedPrice } = eventFreelancerDetails;
    const freelancerBookingFinalizedPrice = finalizedPrice * dayCount;
    const refundConvenienceFees = convenienceFees * dayCount;
    const groupId = UUID();

    for (const recruiterTransaction of recruiterTransactionInstance) {
      if (recruiterTransaction.transactionType === BOOKING_FEES) {
        refundBookingAmountDetails = {
          amount: freelancerBookingFinalizedPrice,
          transactionType: REFUND,
          transactionSubType: BOOKING_FEES,
          userId: recruiterTransaction.userId,
          eventId: recruiterTransaction.eventId,
          freelancerId: eventFreelancerDetails.userId,
          parentId: recruiterTransaction.id,
          groupId,
          modeOfTransaction: CASH,
          transactionStatus: TRANSACTION_COMPLETED,
          closingBalance: recruiterTotalBalance + freelancerBookingFinalizedPrice,
        };
      }

      if (recruiterTransaction.transactionType === CONVENIENCE_FEES) {
        refundConvenienceAmountDetails = {
          amount: refundConvenienceFees,
          transactionType: REFUND,
          transactionSubType: CONVENIENCE_FEES,
          userId: recruiterTransaction.userId,
          eventId: recruiterTransaction.eventId,
          freelancerId: eventFreelancerDetails.userId,
          parentId: recruiterTransaction.id,
          groupId,
          modeOfTransaction: CASH,
          transactionStatus: TRANSACTION_COMPLETED,
        };
      }
    }
    const closingBalance = refundBookingAmountDetails?.closingBalance && refundConvenienceAmountDetails?.amount
      ? refundBookingAmountDetails?.closingBalance + refundConvenienceAmountDetails?.amount : 0;
    refundConvenienceAmountDetails.closingBalance = refundConvenienceAmountDetails && !isEmpty(refundConvenienceAmountDetails)
      ? closingBalance : 0;

    await TransactionModel.create(refundBookingAmountDetails, { transaction });
    await TransactionModel.create(refundConvenienceAmountDetails, { transaction });
    await UserBusinessModel.update({ totalBalance: closingBalance }, { where: { userId: recruiterId }, transaction });

    await Promise.all([
      TransactionModel.update({ transactionStatus: CANCELLED }, {
        where: {
          eventId: getEventInstance.id,
          userId: recruiterId,
          freelancerId,
          transactionType: { [Op.in]: [BOOKING_FEES, CONVENIENCE_FEES] },
          transactionStatus: TRANSACTION_COMPLETED,
        },
        transaction,
      }),

      TransactionModel.update({ transactionStatus: CANCELLED }, {
        where: {
          eventId: getEventInstance.id, userId: freelancerId, transactionType: { [Op.in]: [EVENT_FEES] }, transactionStatus: TRANSACTION_PENDING,
        },
        transaction,
      }),

      TransactionModel.update({ transactionStatus: CANCELLED }, {
        where: {
          eventId: getEventInstance.id, freelancerId, transactionType: { [Op.in]: [COMMISSION] }, transactionStatus: TRANSACTION_COMPLETED,
        },
        transaction,
      }),
    ]);
  } catch (error) {
    transactionLogger(`Error while createTransactionForRemoveFreelancer : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createTransactionForRemoveFreelancer;
