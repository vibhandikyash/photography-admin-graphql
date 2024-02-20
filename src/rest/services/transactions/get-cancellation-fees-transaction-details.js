const { get, map } = require('lodash');

const {
  BOOKING_FEES, REFUND,
  CONFIGURATION_KEYS: {
    EVENT_CANCELATION_PERCENTAGES,
  },
} = require('../../../constants/service-constants');

const {
  models: {
    Transaction: TransactionModel,
    Configuration: ConfigurationModel,
  },
} = require('../../../sequelize-client');

const eventLogger = require('../../modules/events/event-logger');

const getCancellationFeesTransactionDetails = async eventId => {
  try {
    const eventBookingFee = await TransactionModel.findAll(
      {
        where: { eventId, transactionType: BOOKING_FEES },
        attributes: ['id', 'amount'],
      },
    );

    const eventRefundFee = await TransactionModel.findAll(
      {
        where: { eventId, transactionType: REFUND, transactionSubType: BOOKING_FEES },
        attributes: ['id', 'amount'],
      },
    );

    const configurationInstance = await ConfigurationModel.findAll({
      attributes: ['value'],
      where: {
        key: EVENT_CANCELATION_PERCENTAGES,
      },
    });
    let eventCancellationCharges = map(configurationInstance, 'value');

    const deductionAmount = eventBookingFee[0].amount - eventRefundFee[0].amount;

    if (deductionAmount === 0) {
      eventCancellationCharges = '0';
    }
    const response = {
      initialCost: get(eventBookingFee, '[0].amount'),
      deductionCharges: get(eventCancellationCharges, '[0]'),
      refundAmount: get(eventRefundFee, '[0].amount'),
      cancellationAmount: deductionAmount,
    };

    return response;
  } catch (error) {
    eventLogger(`Error from get-cancellation-fees-transaction-details: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = getCancellationFeesTransactionDetails;
