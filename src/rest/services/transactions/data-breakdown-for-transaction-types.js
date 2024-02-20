const {
  BOOKING_FEES,
  CANCELLATION_CHARGES,
  INITIAL_FEES,
  EVENT_FEES,
} = require('../../../constants/service-constants');

const eventLogger = require('../../modules/events/event-logger');

const getBookingFeesTransactionDetails = require('./get-booking-fees-transaction-details');
const getCancellationFeesTransactionDetails = require('./get-cancellation-fees-transaction-details');
const getCompletedPaymentTransactionDetails = require('./get-completed-payment-transaction-details');
const getInitialPaymentTransactionDetails = require('./get-initial-payment-transaction-details');

const dataBreakdownForTransactionTypes = async (type, eventId) => {
  try {
    let response;

    switch (type) {
    case BOOKING_FEES:
      response = await getBookingFeesTransactionDetails(eventId);
      break;
    case CANCELLATION_CHARGES:
      response = await getCancellationFeesTransactionDetails(eventId);
      break;
    case INITIAL_FEES:
      response = await getInitialPaymentTransactionDetails(eventId);
      break;
    case EVENT_FEES:
      response = await getCompletedPaymentTransactionDetails(eventId);
      break;
    default:
      break;
    }

    return response;
  } catch (error) {
    eventLogger(`Error from data-breakdown-for-transaction-types and status: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = dataBreakdownForTransactionTypes;
