const { get, isNaN, round } = require('lodash');
const { Op } = require('sequelize');
const { v4: UUID } = require('uuid');

const {
  EVENT_FEES, COMPLETED, BOOKING_FEES, CANCELLED, PENDING, COMMISSION, SUPER_ADMIN, WEDLANCER,
  REGULARIZE_REQUEST_TYPES: { REGULARIZE, INSUFFICIENT_HOURS },
  CONFIGURATION_KEYS: { FREELANCER_DEDUCTION_PERCENTAGE, REGULARIZE_REQUEST_PRICE_MULTIPLIER },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const getRecruiterAvailableBalance = require('../../../modules/transaction/queries/get-recruiter-available-balance');
const {
  models: {
    Transaction: TransactionModel, EventFreelancer: EventFreelancerModel, UserBusiness: UserBusinessModel, Event: EventModel, User: UserModel,
  },
} = require('../../../sequelize-client');
const { getConfigByKey } = require('../../../shared-lib/configurations');

const updateDaysOnRequestApproval = require('./update-days-on-request-approval');

const updateTransactionOnRequestApproval = async (ctx, eventId, freelancerId, requestId, requestType, isPreviousRequestExtraHours, transaction) => {
  try {
    const groupId = UUID();
    const superAdminInstance = await UserModel.findOne({ where: { role: SUPER_ADMIN }, attributes: ['id'] });

    const [freelancerDeductionPercentage, regularizeRequestPriceMultiplier] = await getConfigByKey(
      [FREELANCER_DEDUCTION_PERCENTAGE, REGULARIZE_REQUEST_PRICE_MULTIPLIER],
    );

    const eventRecruiter = await EventModel.findByPk(eventId, { attributes: ['id', 'recruiterId'] });
    const { recruiterId } = eventRecruiter;

    const [existingBookingFees, existingEventFees, existingCommissionFees] = await Promise.all([
      //  EXISTING BOOKING FEES
      TransactionModel.findOne({
        where: {
          userId: recruiterId,
          transactionType: BOOKING_FEES,
          eventId,
          transactionStatus: { [Op.ne]: CANCELLED },
          freelancerId,
        },
        attributes: ['id', 'userId', 'transactionType', 'amount', 'metaData'],
      }),
      // EXISTING EVENT FEES
      TransactionModel.findOne({
        where: {
          userId: freelancerId, transactionType: EVENT_FEES, eventId, transactionStatus: { [Op.ne]: CANCELLED },
        },
        attributes: ['id', 'userId', 'transactionType', 'amount', 'metaData'],
      }),
      // EXISTING COMMISSION FEES
      TransactionModel.findOne({
        where: {
          freelancerId, transactionType: COMMISSION, eventId, transactionStatus: { [Op.ne]: CANCELLED },
        },
        attributes: ['id', 'userId', 'transactionType', 'amount', 'metaData'],
      }),
    ]);

    const eventFeesMetaData = get(existingEventFees, 'metaData');
    const bookingFeesMetaData = get(existingBookingFees, 'metaData.regularizeRequests');
    const commissionMetaData = get(existingCommissionFees, 'metaData.regularizeRequests');
    const regularizeRequests = { cancelledById: requestId };

    const metaDataToBeUpdatedForEventFees = eventFeesMetaData.regularizeRequests ? {
      ...eventFeesMetaData,
      regularizeRequests: { ...eventFeesMetaData.regularizeRequests, ...regularizeRequests },
    } : { ...eventFeesMetaData, regularizeRequests };

    const metaDataToBeUpdatedForBookingFees = { regularizeRequests: { ...bookingFeesMetaData, ...regularizeRequests } };

    const metaDataToBeUpdatedForCommissionFees = { regularizeRequests: { ...commissionMetaData, ...regularizeRequests } };

    const updateTransactionStatus = { transactionStatus: CANCELLED };

    let updateBookingFeesData;
    let updateCommissionFeesData;

    // CHECK IF THE META DATA IS NOT AN EMPTY OBJECT THEN APPEND THE UPDATED DATA TO META DATA
    if (bookingFeesMetaData || commissionMetaData) {
      updateBookingFeesData = { ...updateTransactionStatus, metaData: metaDataToBeUpdatedForBookingFees };
      updateCommissionFeesData = { ...updateTransactionStatus, metaData: metaDataToBeUpdatedForCommissionFees };
    } else {
      updateBookingFeesData = { ...updateTransactionStatus, metaData: { regularizeRequests: { cancelledById: requestId } } };
      updateCommissionFeesData = { ...updateTransactionStatus, metaData: { regularizeRequests: { cancelledById: requestId } } };
    }

    // UPDATED THE EXISTING BOOKING, EVENT AND COMMISSION FEES DATA
    await existingEventFees?.update({ ...updateTransactionStatus, metaData: metaDataToBeUpdatedForEventFees }, { transaction });
    await existingBookingFees?.update(updateBookingFeesData, { transaction });
    await existingCommissionFees?.update(updateCommissionFeesData, { transaction });

    // GET FREELANCER'S FINALIZED PRICE
    const eventFreelancerInstance = await EventFreelancerModel.findOne({
      where: { eventId, userId: freelancerId },
      attributes: ['id', 'userId', 'eventId', 'finalizedPrice'],
    });

    const { finalizedPrice } = eventFreelancerInstance;
    const { amount: bookingFeesAmount } = existingBookingFees;

    let { totalBalance: recruiterCurrentBalance } = await getRecruiterAvailableBalance(null, { recruiterId }, ctx);
    recruiterCurrentBalance = isNaN(recruiterCurrentBalance) ? 0 : recruiterCurrentBalance;

    const finalizedPriceCalculation = (finalizedPrice * round(regularizeRequestPriceMultiplier - 1, 2));
    let feesToBeUpdated;
    if (requestType === REGULARIZE) {
      feesToBeUpdated = bookingFeesAmount + finalizedPriceCalculation;
    }
    if (requestType === INSUFFICIENT_HOURS || (requestType === REGULARIZE && isPreviousRequestExtraHours)) {
      feesToBeUpdated = bookingFeesAmount - finalizedPriceCalculation;
    }
    const closingBalance = recruiterCurrentBalance - feesToBeUpdated;
    const eventFeesAfterDeduction = (feesToBeUpdated * freelancerDeductionPercentage) / 100;

    const transactionDataForEventFees = {
      userId: freelancerId,
      eventId,
      transactionType: EVENT_FEES,
      transactionStatus: PENDING,
      groupId,
      amount: feesToBeUpdated - eventFeesAfterDeduction,
      metaData: {
        regularizeRequests: {
          createdById: requestId,
        },
        deductionPercentage: freelancerDeductionPercentage,
        totalAmount: feesToBeUpdated,
        deductionAmount: eventFeesAfterDeduction,
        freelancerId,
      },
    };

    const transactionDataForBookingFees = {
      userId: recruiterId,
      eventId,
      amount: feesToBeUpdated,
      freelancerId,
      groupId,
      closingBalance,
      transactionType: BOOKING_FEES,
      transactionStatus: COMPLETED,
      metaData: {
        regularizeRequests: {
          createdById: requestId,
        },
      },
    };

    const transactionDataForCommission = {
      userId: superAdminInstance.id,
      eventId,
      freelancerId,
      groupId,
      amount: eventFeesAfterDeduction,
      tag: WEDLANCER,
      transactionType: COMMISSION,
      transactionStatus: COMPLETED,
      metaData: {
        regularizeRequests: {
          createdById: requestId,
        },
      },
    };

    await TransactionModel.bulkCreate([transactionDataForEventFees, transactionDataForBookingFees, transactionDataForCommission], { transaction });
    await UserBusinessModel.update({ totalBalance: closingBalance }, { where: { userId: recruiterId }, transaction });
    const metaDataToBeUpdated = await updateDaysOnRequestApproval(freelancerId, eventId, requestId, requestType,
      isPreviousRequestExtraHours, transaction);
    return metaDataToBeUpdated;
  } catch (error) {
    defaultLogger(`Error from update-transaction-on-request-approval: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = updateTransactionOnRequestApproval;
