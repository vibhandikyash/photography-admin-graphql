/* eslint-disable no-restricted-syntax */
const { get, isNaN } = require('lodash');
const moment = require('moment');
const { v4: UUID } = require('uuid');

const {
  BOOKING_FEES, TRANSACTION_COMPLETED, REFUND, CONFIGURATION_KEYS: { CONVENIENCE_FEES }, CANCELLATION_CHARGES, CANCELLED,
} = require('../../../constants/service-constants');
const eventLogger = require('../event-logger');

/**
 * Get the event cancel hour is same as cancelationEventHours
 * @param {timestamp} eventStartDate
 * @param {timestamp} currentDate
 * @param {int|string|number} cancelationEventHours
 * @param {*} ctx
 * @returns boolean
 */
const getDifferenceBetweenEventStartDateAndCurrentDate = async (eventStartDate, currentDate, cancelationEventHours, ctx = null) => {
  try {
    const momentEventStarDate = moment(eventStartDate);
    const duration = moment.duration(momentEventStarDate.diff(currentDate));
    const hours = Math.floor(duration.asHours());
    if (hours <= cancelationEventHours) {
      return true;
    }
    return false;
  } catch (error) {
    eventLogger(`Error while get difference between event start date and currentDate : ${error}`, ctx, 'error');
    throw error;
  }
};

/**
 * Get the transactions object for the event cancellation
 * @param {*} recruiterTransaction
 * @param {*} recruiterDetails
 * @param {*} eventDateDifference
 * @param {*} eventCancelationPercentage
 * @param {*} ctx
 * @returns
 */
const getUsersTransactionDataForCancelationCharges = async (recruiterTransaction,
  recruiterDetails, eventDateDifference, eventCancelationPercentage, ctx = null) => {
  try {
    const recruiterRefundBookingFeesTransactionData = {};
    const recruiterRefundConvenienceFeesData = {};
    const recruiterCancelationFeesData = {};
    const recruiterBalanceToBeUpdate = {};
    let recruiterTotalAmount = get(recruiterDetails, 'business.totalBalance', 0);
    recruiterTotalAmount = isNaN(recruiterTotalAmount) ? 0 : recruiterTotalAmount;
    const groupId = UUID();
    if (!eventDateDifference) {
      for (const recruiter of recruiterTransaction) {
        recruiterRefundBookingFeesTransactionData.eventId = recruiter.eventId;
        recruiterRefundBookingFeesTransactionData.userId = recruiter.userId;
        recruiterRefundBookingFeesTransactionData.transactionStatus = TRANSACTION_COMPLETED;
        recruiterRefundBookingFeesTransactionData.transactionType = REFUND;
        recruiterRefundBookingFeesTransactionData.groupId = groupId;

        if (recruiter.transactionType === BOOKING_FEES) {
          recruiterRefundBookingFeesTransactionData.amount = recruiter.amount;
          recruiterRefundBookingFeesTransactionData.closingBalance = recruiterTotalAmount + recruiter.amount;
          recruiterRefundBookingFeesTransactionData.transactionSubType = BOOKING_FEES;
        }

        recruiterRefundConvenienceFeesData.eventId = recruiter.eventId;
        recruiterRefundConvenienceFeesData.userId = recruiter.userId;
        recruiterRefundConvenienceFeesData.transactionStatus = TRANSACTION_COMPLETED;
        recruiterRefundConvenienceFeesData.transactionType = REFUND;
        recruiterRefundConvenienceFeesData.groupId = groupId;

        if (recruiter.transactionType === CONVENIENCE_FEES) {
          recruiterRefundConvenienceFeesData.amount = recruiter.amount;
          recruiterRefundConvenienceFeesData.closingBalance = recruiterRefundBookingFeesTransactionData.closingBalance
            + recruiterRefundConvenienceFeesData.amount;
          recruiterRefundConvenienceFeesData.transactionSubType = CONVENIENCE_FEES;
          recruiterBalanceToBeUpdate.totalBalance = recruiterRefundConvenienceFeesData.closingBalance;
        }
      }
    } else {
      for (const recruiter of recruiterTransaction) {
        recruiterRefundBookingFeesTransactionData.eventId = recruiter.eventId;
        recruiterRefundBookingFeesTransactionData.userId = recruiter.userId;
        recruiterRefundBookingFeesTransactionData.transactionStatus = TRANSACTION_COMPLETED;
        recruiterRefundBookingFeesTransactionData.transactionType = REFUND;
        recruiterRefundBookingFeesTransactionData.groupId = groupId;

        recruiterCancelationFeesData.eventId = recruiter.eventId;
        recruiterCancelationFeesData.userId = recruiter.userId;
        recruiterCancelationFeesData.transactionStatus = TRANSACTION_COMPLETED;
        recruiterCancelationFeesData.transactionType = CANCELLATION_CHARGES;
        recruiterCancelationFeesData.groupId = groupId;

        if (recruiter.transactionType === BOOKING_FEES) {
          let amountAfterApplyCancelationCharges = recruiter.amount * eventCancelationPercentage;
          amountAfterApplyCancelationCharges /= 100;
          recruiterRefundBookingFeesTransactionData.amount = amountAfterApplyCancelationCharges;
          recruiterCancelationFeesData.amount = amountAfterApplyCancelationCharges;
          recruiterRefundBookingFeesTransactionData.transactionSubType = BOOKING_FEES;
          recruiterRefundBookingFeesTransactionData.closingBalance = recruiterTotalAmount - amountAfterApplyCancelationCharges;
        }

        recruiterRefundConvenienceFeesData.eventId = recruiter.eventId;
        recruiterRefundConvenienceFeesData.userId = recruiter.userId;
        recruiterRefundConvenienceFeesData.transactionStatus = TRANSACTION_COMPLETED;
        recruiterRefundConvenienceFeesData.transactionType = REFUND;
        recruiterRefundConvenienceFeesData.groupId = groupId;

        if (recruiter.transactionType === CONVENIENCE_FEES) {
          let convenienceCancelationCharges = recruiter.amount * eventCancelationPercentage;
          convenienceCancelationCharges /= 100;
          recruiterRefundConvenienceFeesData.amount = convenienceCancelationCharges;
          recruiterCancelationFeesData.amount += convenienceCancelationCharges;
          recruiterRefundConvenienceFeesData.closingBalance = recruiterRefundBookingFeesTransactionData.closingBalance
          - convenienceCancelationCharges;
          recruiterRefundConvenienceFeesData.transactionSubType = CONVENIENCE_FEES;
          recruiterBalanceToBeUpdate.totalBalance = recruiterRefundConvenienceFeesData.closingBalance;
        }
        recruiterCancelationFeesData.closingBalance = recruiterTotalAmount - recruiterCancelationFeesData.amount;
      }
    }
    return [
      recruiterRefundBookingFeesTransactionData,
      recruiterRefundConvenienceFeesData,
      recruiterCancelationFeesData,
      recruiterBalanceToBeUpdate];
  } catch (error) {
    eventLogger(`Error while get users transaction data for cancelation charges : ${error}`, ctx, 'error');
    throw error;
  }
};

/**
 * Get the to be update object for cancellation
 * @param {UserModel} user
 * @param {uuid} eventId
 * @param {string} note
 * @returns
 */
const getDetailsForUpdateEvent = async (user, eventId, note = null) => {
  const dataToBeUpdate = {
    status: CANCELLED,
    cancelledBy: user?.id,
    note,
  };
  const where = {
    id: eventId,
  };

  return [dataToBeUpdate, where];
};

module.exports = {
  getDifferenceBetweenEventStartDateAndCurrentDate,
  getUsersTransactionDataForCancelationCharges,
  getDetailsForUpdateEvent,
};
