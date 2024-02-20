const {
  CANCELLED, CANCELLATION_CHARGES, CONFIGURATION_KEYS: { CONVENIENCE_FEES }, COMPLETED,
} = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const transactionLogger = require('../transaction-logger');

const getCancellationOrConvenienceFeesForEvent = async (_, args, ctx) => {
  try {
    const { localeService } = ctx;
    const { data } = args;
    const { eventId, transactionType } = data;
    const { Event: EventModel, Transaction: TransactionModel } = ctx.models;

    const eventInstance = await EventModel.findByPk(eventId);

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    if (transactionType === CANCELLATION_CHARGES && eventInstance.status !== CANCELLED) {
      throw new CustomApolloError(getMessage('EVENT_NOT_CANCELLED', localeService));
    }
    let getEventTransactionInstance;

    if (transactionType === CANCELLATION_CHARGES) {
      getEventTransactionInstance = await TransactionModel.findOne({
        where: {
          eventId,
          transactionType: CANCELLATION_CHARGES,
          transactionStatus: COMPLETED,
        },
        attributes: ['amount'],
      });
    }

    if (transactionType === CONVENIENCE_FEES) {
      getEventTransactionInstance = await TransactionModel.findAll({
        where: {
          eventId,
          transactionType: CONVENIENCE_FEES,
          transactionStatus: COMPLETED,
        },
        attributes: ['amount'],
      });
    }

    if (!getEventTransactionInstance) {
      throw new CustomApolloError(getMessage('TRANSACTION_NOT_FOUND', localeService));
    }
    const totalAmount = getEventTransactionInstance.length
      ? getEventTransactionInstance.reduce((initialObj, obj) => initialObj + obj.amount, 0) : getEventTransactionInstance.amount;

    const response = {
      amount: totalAmount,
    };

    return response;
  } catch (error) {
    transactionLogger(`Error while get get cancellation or convenience fees or event : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getCancellationOrConvenienceFeesForEvent;
