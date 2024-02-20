/* eslint-disable no-restricted-syntax */
const { get, isNaN } = require('lodash');
const moment = require('moment');
const { Op } = require('sequelize');

const {
  BOOKING_FEES, CONFIGURATION_KEYS: { CONVENIENCE_FEES }, EVENT_FEES, REFUND, MODE_OF_PAYMENT: { CASH }, TRANSACTION_COMPLETED,
} = require('../../../constants/service-constants');
const eventLogger = require('../event-logger');

const getUserTransactionDetails = (eventFreelancer, eventData, ctx) => {
  try {
    const { recruiterId, id } = eventData;
    const { userId, eventId } = eventFreelancer;

    const recruiterWhere = {
      userId: recruiterId,
      eventId: id,
      transactionType: {
        [Op.in]: [BOOKING_FEES, CONVENIENCE_FEES],
      },
    };

    const freelancerWhere = {
      userId,
      eventId,
      transactionType: {
        [Op.in]: [EVENT_FEES],
      },
    };

    return [recruiterWhere, freelancerWhere];
  } catch (error) {
    eventLogger(`Error while get user transaction details for remove freelancer from event : ${error}`, ctx, 'error');
    throw error;
  }
};

const getRecruiterAndFreelancerAmountDetails = (recruiterTransactionDetails, eventDetails,
  freelancerDetails, recruiterBalanceDetails, convenienceFees, ctx) => {
  try {
    let refundBookingAmountDetails = {};
    let refundConvenienceAmountDetails = {};
    let { startDate, endDate } = eventDetails;
    startDate = moment(startDate);
    endDate = moment(endDate);
    let recruiterTotalAmount = get(recruiterBalanceDetails, 'business.totalBalance', 0);
    recruiterTotalAmount = isNaN(recruiterTotalAmount) ? 0 : recruiterTotalAmount;
    let dayCount = endDate.diff(startDate, 'days');
    dayCount += 1;

    const freelancerBookingFinalizedPrice = freelancerDetails?.finalizedPrice * dayCount;
    const refundConvenienceFees = convenienceFees * dayCount;

    for (const recruiterTransaction of recruiterTransactionDetails) {
      if (recruiterTransaction.transactionType === BOOKING_FEES) {
        refundBookingAmountDetails = {
          amount: freelancerBookingFinalizedPrice,
          transactionType: REFUND,
          transactionSubType: BOOKING_FEES,
          userId: recruiterTransaction.userId,
          eventId: recruiterTransaction.eventId,
          modeOfPayment: CASH,
          transactionStatus: TRANSACTION_COMPLETED,
          closingBalance: recruiterTotalAmount + freelancerBookingFinalizedPrice,
        };
      }
      if (recruiterTransaction.transactionType === CONVENIENCE_FEES) {
        refundConvenienceAmountDetails = {
          amount: refundConvenienceFees,
          transactionType: REFUND,
          transactionSubType: CONVENIENCE_FEES,
          userId: recruiterTransaction.userId,
          eventId: recruiterTransaction.eventId,
          modeOfPayment: CASH,
          transactionStatus: TRANSACTION_COMPLETED,
          closingBalance: refundBookingAmountDetails.closingBalance + refundConvenienceFees,
        };
      }
    }
    let totalRefundAmount = refundBookingAmountDetails?.amount + refundConvenienceAmountDetails?.amount;
    totalRefundAmount = recruiterTotalAmount + totalRefundAmount;
    const recruiterUpdatedBalanceObj = {
      totalBalance: totalRefundAmount,
    };

    const recruiterUpdatedBalanceWhereObj = {
      userId: recruiterBalanceDetails?.userId,
    };
    const freelancerWhere = {
      userId: freelancerDetails?.userId,
      transactionType: EVENT_FEES,
    };

    return [
      refundBookingAmountDetails,
      refundConvenienceAmountDetails,
      recruiterUpdatedBalanceObj,
      recruiterUpdatedBalanceWhereObj,
      freelancerWhere,
    ];
  } catch (error) {
    eventLogger(`Error while get recruiter and freelancer amount details for remove freelancer from event : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = { getUserTransactionDetails, getRecruiterAndFreelancerAmountDetails };
