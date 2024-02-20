const { COMPLETED, PENDING, EVENT_FEES } = require('../../../constants/service-constants');
const {
  models: { Transaction: TransactionModel, EventFreelancer: EventFreelancerModel },
} = require('../../../sequelize-client');
const eventLogger = require('../../modules/events/event-logger');

const eventPriceBreakDownForFreelancer = async (userId, daysCount, eventId) => {
  try {
    const eventFees = await TransactionModel.findOne({
      where: {
        userId,
        transactionStatus: [COMPLETED, PENDING],
        transactionType: EVENT_FEES,
        eventId,
      },
    });
    const eventFreelancer = await EventFreelancerModel.findOne({ where: { userId, eventId }, attributes: ['finalizedPrice'] });

    const { metaData: { deductionAmount }, amount: eventFeesAmount } = eventFees;

    const { finalizedPrice } = eventFreelancer;
    const priceBreakdown = {
      daysCount,
      finalizedPrice,
      deductionAmount,
      totalPayable: eventFeesAmount,
    };
    return priceBreakdown;
  } catch (error) {
    eventLogger(`Error from event-price-breakdown-for-freelancer: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = eventPriceBreakDownForFreelancer;
