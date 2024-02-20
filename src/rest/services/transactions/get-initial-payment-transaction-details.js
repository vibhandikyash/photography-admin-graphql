const { get } = require('lodash');

const { INITIAL_FEES } = require('../../../constants/service-constants');

const {
  models: {
    Transaction: TransactionModel,
  },
} = require('../../../sequelize-client');

const eventLogger = require('../../modules/events/event-logger');

const getInitialPaymentTransactionDetails = async eventId => {
  try {
    const recruiterInitialFee = await TransactionModel.findOne(
      {
        where: { eventId, transactionType: INITIAL_FEES },
        attributes: ['id', 'amount', 'createdAt'],
      },
    );

    const response = {
      amount: get(recruiterInitialFee, 'amount'),
      dataOfPayment: get(recruiterInitialFee, 'createdAt'),
    };

    return response;
  } catch (error) {
    eventLogger(`Error from get-initial-payment-transaction-details: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = getInitialPaymentTransactionDetails;
