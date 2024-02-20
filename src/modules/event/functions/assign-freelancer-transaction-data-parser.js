/* eslint-disable no-restricted-syntax */
const { get, isNaN } = require('lodash');
const moment = require('moment');

const {
  BOOKING_FEES, TRANSACTION_COMPLETED, EVENT_FEES, CONFIGURATION_KEYS: { CONVENIENCE_FEES },
} = require('../../../constants/service-constants');
const eventLogger = require('../event-logger');

const getDataForNewTransactionForAssignedFreelancer = async (freelancerDetails, recruiterDetails, eventDetails,
  convenienceFeesAndFreelancerDeduction, transactionType, ctx) => {
  try {
    // eslint-disable-next-line prefer-const
    let [convenienceFees, freelancerDeductionPercentage] = convenienceFeesAndFreelancerDeduction;
    const recruiterBalanceAfterUpdatingTransaction = {};
    const dataToBeUpdatedForFreelancerEventFeesTransaction = {};
    let recruiterTotalAmount = get(recruiterDetails, 'business.totalBalance', 0);
    recruiterTotalAmount = isNaN(recruiterTotalAmount) ? 0 : recruiterTotalAmount;
    const dataToBeUpdatedForBookingTransaction = {
      userId: eventDetails.recruiterId,
      eventId: freelancerDetails.eventId,
      transactionType,
      transactionStatus: TRANSACTION_COMPLETED,
    };

    const dataToBeUpdatedForConvenienceFeesTransaction = {
      userId: eventDetails.recruiterId,
      eventId: freelancerDetails.eventId,
      transactionType: CONVENIENCE_FEES,
      transactionStatus: TRANSACTION_COMPLETED,
    };

    if (transactionType === BOOKING_FEES) {
      let freelancerEventFees;
      dataToBeUpdatedForFreelancerEventFeesTransaction.userId = freelancerDetails.userId;
      dataToBeUpdatedForFreelancerEventFeesTransaction.eventId = freelancerDetails.eventId;
      dataToBeUpdatedForFreelancerEventFeesTransaction.transactionType = EVENT_FEES;

      const startDate = moment(eventDetails.startDate);
      const endDate = moment(eventDetails.endDate);
      let totalDays = endDate.diff(startDate, 'days');
      totalDays += 1;
      // consider total day of event 1 if we are getting 0 difference as start day and end day is same but time is different for same day
      if (totalDays === 1) {
        freelancerEventFees = freelancerDetails.finalizedPrice;
        dataToBeUpdatedForConvenienceFeesTransaction.amount = convenienceFees;
        dataToBeUpdatedForBookingTransaction.amount = freelancerDetails.finalizedPrice;
        dataToBeUpdatedForFreelancerEventFeesTransaction.amount = freelancerEventFees;
        dataToBeUpdatedForBookingTransaction.closingBalance = recruiterTotalAmount - freelancerEventFees;
        dataToBeUpdatedForConvenienceFeesTransaction.closingBalance = dataToBeUpdatedForBookingTransaction.closingBalance - convenienceFees;
      }
      if (totalDays > 1) {
        freelancerEventFees = freelancerDetails.finalizedPrice * totalDays;
        convenienceFees *= totalDays;
        freelancerDetails.finalizedPrice *= totalDays;
        dataToBeUpdatedForConvenienceFeesTransaction.amount = convenienceFees;
        dataToBeUpdatedForBookingTransaction.amount = freelancerDetails.finalizedPrice;
        dataToBeUpdatedForFreelancerEventFeesTransaction.amount = freelancerEventFees;
        dataToBeUpdatedForBookingTransaction.closingBalance = recruiterTotalAmount - freelancerEventFees;
        dataToBeUpdatedForConvenienceFeesTransaction.closingBalance = dataToBeUpdatedForBookingTransaction.closingBalance - convenienceFees;
      }
      recruiterBalanceAfterUpdatingTransaction.totalBalance = dataToBeUpdatedForConvenienceFeesTransaction.closingBalance;
    }

    // deduct 10% from event fees earn by freelancer
    let eventFeesAFterDeduction = dataToBeUpdatedForFreelancerEventFeesTransaction.amount * freelancerDeductionPercentage;
    eventFeesAFterDeduction /= 100;
    dataToBeUpdatedForFreelancerEventFeesTransaction.amount -= eventFeesAFterDeduction;

    return [
      dataToBeUpdatedForBookingTransaction,
      dataToBeUpdatedForConvenienceFeesTransaction,
      dataToBeUpdatedForFreelancerEventFeesTransaction,
      recruiterBalanceAfterUpdatingTransaction,
    ];
  } catch (error) {
    eventLogger(`Error while get data for new transaction for assigned freelancer: ${error}`, ctx, 'error');
    throw error;
  }
};

// Need to calculate event fees based on event date, remove calender details
const getDataForExistingTransactionForAssignedFreelancer = async (freelancerDetails, recruiterDetails, calenderDetails,
  existingTransactionInstance, convenienceFeesAndFreelancerDeduction, ctx) => {
  try {
    const [convenienceFees, freelancerDeductionPercentage] = convenienceFeesAndFreelancerDeduction;
    const recruiterBalanceAfterUpdatingTransaction = {};

    const bookingFeesToBeUpdated = {};
    const convenienceFeesToBeUpdated = {};
    let recruiterTotalAmount = get(recruiterDetails, 'business.totalBalance', 0);
    recruiterTotalAmount = isNaN(recruiterTotalAmount) ? 0 : recruiterTotalAmount;
    const recruiterWhere = {
      userId: recruiterDetails?.id,
      eventId: freelancerDetails?.eventId,
    };
    const eventFeesTransaction = {
      userId: freelancerDetails.userId,
      eventId: freelancerDetails.eventId,
      transactionType: EVENT_FEES,
      amount: freelancerDetails.finalizedPrice,
    };

    const startDate = moment(calenderDetails.startDate);
    const endDate = moment(calenderDetails.endDate);
    let totalDays = endDate.diff(startDate, 'days');
    if (totalDays === 0) {
      totalDays = 1;
    }
    for (const transaction of existingTransactionInstance) {
      if (transaction.transactionType === BOOKING_FEES) {
        let bookingTransactionAmount;
        if (totalDays === 1) {
          bookingTransactionAmount = transaction.amount + freelancerDetails?.finalizedPrice;
          bookingFeesToBeUpdated.amount = bookingTransactionAmount;
          bookingFeesToBeUpdated.closingBalance = recruiterTotalAmount - bookingTransactionAmount;
        }
        if (totalDays > 1) {
          bookingTransactionAmount = freelancerDetails?.finalizedPrice * totalDays;
          eventFeesTransaction.amount *= totalDays;
          bookingFeesToBeUpdated.amount = transaction.amount + bookingTransactionAmount;
          bookingFeesToBeUpdated.closingBalance = recruiterTotalAmount - bookingTransactionAmount;
        }
      }
      if (transaction.transactionType === CONVENIENCE_FEES) {
        let updatedConvenienceFees;
        if (totalDays === 1) {
          updatedConvenienceFees = transaction?.amount + Number(convenienceFees);
          convenienceFeesToBeUpdated.amount = updatedConvenienceFees;
          convenienceFeesToBeUpdated.closingBalance = bookingFeesToBeUpdated.closingBalance - Number(convenienceFees);
        }
        if (totalDays > 1) {
          updatedConvenienceFees = Number(convenienceFees) * totalDays;
          convenienceFeesToBeUpdated.closingBalance = bookingFeesToBeUpdated.closingBalance - updatedConvenienceFees;
          updatedConvenienceFees += transaction?.amount;
          convenienceFeesToBeUpdated.amount = updatedConvenienceFees;
        }
        recruiterBalanceAfterUpdatingTransaction.totalBalance = convenienceFeesToBeUpdated.closingBalance;
      }
    }

    // deduct 10% from event fees earn by freelancer
    let eventFeesAfterDeduction = eventFeesTransaction.amount * freelancerDeductionPercentage;
    eventFeesAfterDeduction /= 100;
    eventFeesTransaction.amount -= eventFeesAfterDeduction;

    return [
      bookingFeesToBeUpdated,
      convenienceFeesToBeUpdated,
      eventFeesTransaction,
      recruiterWhere,
      recruiterBalanceAfterUpdatingTransaction,
    ];
  } catch (error) {
    eventLogger(`Error while get data for existing transaction for assigned freelancer: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = { getDataForNewTransactionForAssignedFreelancer, getDataForExistingTransactionForAssignedFreelancer };
