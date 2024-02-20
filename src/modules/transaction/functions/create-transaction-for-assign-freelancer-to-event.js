
const { isNaN } = require('lodash');
const { v4: UUID } = require('uuid');

const {
  BOOKING_FEES,
  CONFIGURATION_KEYS: { CONVENIENCE_FEES, FREELANCER_DEDUCTION_PERCENTAGE },
  TRANSACTION_COMPLETED, EVENT_FEES, COMMISSION, WEDLANCER, SUPER_ADMIN,
} = require('../../../constants/service-constants');

const { getConfigByKey } = require('../../../shared-lib/configurations');
const getRecruiterAvailableBalance = require('../queries/get-recruiter-available-balance');
const transactionLogger = require('../transaction-logger');

const createTransactionForAssignFreelancerToEvent = async (freelancerId, eventId, transaction, totalDays, ctx) => {
  try {
    const {
      EventFreelancer: EventFreelancerModel, User: UserModel, UserBusiness: UserBusinessModel,
      Event: EventModel, Transaction: TransactionModel,
    } = ctx.models;

    const getEventInstance = await EventModel.findByPk(eventId, { transaction });
    const { recruiterId } = getEventInstance;

    const getAssignedFreelancerInstance = await EventFreelancerModel.findOne({
      where: {
        userId: freelancerId,
        eventId,
        isAssigned: true,
      },
      transaction,
    });

    if (getAssignedFreelancerInstance) {
      const [convenienceFees, freelancerDeductionPercentage] = await getConfigByKey([CONVENIENCE_FEES, FREELANCER_DEDUCTION_PERCENTAGE]);
      const groupId = UUID();

      const superAdminInstance = await UserModel.findOne({ where: { role: SUPER_ADMIN }, attributes: ['id'] });

      let { totalBalance: recruiterCurrentBalance } = await getRecruiterAvailableBalance(null, { recruiterId }, ctx);
      recruiterCurrentBalance = isNaN(recruiterCurrentBalance) ? 0 : recruiterCurrentBalance;
      const { userId, finalizedPrice } = getAssignedFreelancerInstance;

      const createForBookingTransaction = {
        userId: recruiterId,
        freelancerId: userId,
        groupId,
        eventId,
        amount: finalizedPrice * totalDays,
        transactionType: BOOKING_FEES,
        transactionStatus: TRANSACTION_COMPLETED,
      };

      const convenienceFeesTransaction = {
        userId: recruiterId,
        freelancerId: userId,
        eventId,
        groupId,
        amount: convenienceFees * totalDays,
        tag: WEDLANCER,
        transactionType: CONVENIENCE_FEES,
        transactionStatus: TRANSACTION_COMPLETED,
      };

      const commissionFeesTransaction = {
        userId: superAdminInstance.id,
        eventId,
        freelancerId: userId,
        groupId,
        tag: WEDLANCER,
        transactionType: COMMISSION,
        transactionStatus: TRANSACTION_COMPLETED,
      };

      const freelancerEventFeesTransaction = {
        userId,
        eventId,
        transactionType: EVENT_FEES,
        groupId,
      };

      const freelancerEventFees = finalizedPrice * totalDays;
      // calculate closing balance for bookingFees by subtracts eventFees from recruiter current balance
      let closingBalance = recruiterCurrentBalance - freelancerEventFees;
      createForBookingTransaction.closingBalance = closingBalance;
      // calculate closing balance for convenienceFees by subtracts convenienceFees amount from previous closing balance
      closingBalance -= convenienceFeesTransaction.amount;
      convenienceFeesTransaction.closingBalance = closingBalance;

      // deduct 10% from event fees earn by freelancer
      const eventFeesAfterDeduction = (freelancerEventFees * freelancerDeductionPercentage) / 100;
      commissionFeesTransaction.amount = eventFeesAfterDeduction;

      freelancerEventFeesTransaction.amount = freelancerEventFees - eventFeesAfterDeduction;

      freelancerEventFeesTransaction.metaData = {
        deductionPercentage: freelancerDeductionPercentage,
        totalAmount: freelancerEventFees,
        deductionAmount: eventFeesAfterDeduction,
        freelancerId,
      };
      await TransactionModel.create(createForBookingTransaction, { transaction });
      await TransactionModel.create(convenienceFeesTransaction, { transaction });
      await TransactionModel.bulkCreate([freelancerEventFeesTransaction, commissionFeesTransaction], transaction);
      await UserBusinessModel.update({ totalBalance: closingBalance }, { where: { userId: recruiterId }, transaction });
    }
  } catch (error) {
    transactionLogger(`Error while createTransactionForAssignFreelancerToEvent: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createTransactionForAssignFreelancerToEvent;
