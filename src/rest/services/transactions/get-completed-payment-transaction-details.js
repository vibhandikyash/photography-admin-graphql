const { EVENT_FEES } = require('../../../constants/service-constants');
const {
  models: {
    User: UserModel,
    Event: EventModel,
    Transaction: TransactionModel,
  },
} = require('../../../sequelize-client');

const eventLogger = require('../../modules/events/event-logger');

const getCompletedPaymentTransactionDetails = async eventId => {
  try {
    const completedTransactionDetails = await TransactionModel.findOne(
      {
        where: { eventId, transactionType: EVENT_FEES },
        attributes: ['id', ['created_at', 'dateOfPayment']],
        include: [
          {
            model: EventModel,
            as: 'event',
            attributes: ['name'],
            include: [
              {
                model: UserModel,
                as: 'recruiter',
                attributes: ['fullName'],
              },
            ],
          },
        ],
      },
    );

    return completedTransactionDetails;
  } catch (error) {
    eventLogger(`Error from get-completed-payment-transaction-details: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = getCompletedPaymentTransactionDetails;
