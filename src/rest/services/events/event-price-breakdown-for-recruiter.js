/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { get } = require('lodash');

const {
  COMPLETED, PENDING, CONFIGURATION_KEYS: { CONVENIENCE_FEES }, EVENT_FEES, WEDLANCER_ASSURED, FREE, PREMIUM, COMMISSION,
} = require('../../../constants/service-constants');
const { models: { Transaction: TransactionModel } } = require('../../../sequelize-client');
const { getConfigByKey } = require('../../../shared-lib/configurations');
const eventLogger = require('../../modules/events/event-logger');

const eventPriceBreakDownForRecruiter = async (userId, assignedFreelancers, eventId, daysCount) => {
  try {
    const [freelancerConvenienceFee] = await getConfigByKey([CONVENIENCE_FEES]);

    const freelancersPrice = [];
    let totalPayable = 0;
    const convenienceFee = freelancerConvenienceFee * daysCount * assignedFreelancers.length;
    for (const freelancer of assignedFreelancers) {
      const typeKey = get(freelancer, 'user.profile.typeKey');
      let price;
      if (typeKey === PREMIUM || typeKey === FREE) {
        const eventAmount = freelancer?.finalizedPrice * daysCount;
        totalPayable += eventAmount;
        price = {
          name: freelancer?.user?.fullName,
          daysCount,
          amount: eventAmount,
          category: freelancer?.user?.category,
        };
      }
      if (typeKey === WEDLANCER_ASSURED) {
        const eventFees = await TransactionModel.findOne({
          where: {
            userId: freelancer?.user?.id,
            transactionStatus: [COMPLETED, PENDING],
            transactionType: EVENT_FEES,
            eventId,
          },
        });

        const commission = await TransactionModel.findOne({
          where: {
            freelancerId: freelancer?.user?.id,
            transactionStatus: [COMPLETED, PENDING],
            transactionType: COMMISSION,
            eventId,
          },
        });
        const { amount: eventFeesAmount } = eventFees;
        const { amount: commissionFeesAmount } = commission;
        price = {
          name: freelancer.user?.fullName,
          daysCount,
          amount: eventFeesAmount + commissionFeesAmount,
          category: freelancer.user?.category,
        };
        totalPayable += (eventFeesAmount + commissionFeesAmount);
      }
      freelancersPrice.push(price);
    }
    totalPayable += convenienceFee;
    const priceBreakdown = {
      freelancerCount: assignedFreelancers.length,
      daysCount,
      convenienceFee,
      totalPayable,
      price: freelancersPrice,
    };
    return priceBreakdown;
  } catch (error) {
    eventLogger(`Error from event-price-break-down-for-recruiter: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = eventPriceBreakDownForRecruiter;
