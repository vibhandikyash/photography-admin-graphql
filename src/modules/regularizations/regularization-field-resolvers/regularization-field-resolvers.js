const regularizeRequestUserFieldResolver = require('./regularize-requests-user-field-resolver');

const regularizationFieldResolvers = {
  RegularizeRequestTransaction: {
    eventFees: {
      resolve: RegularizeRequestTransaction => RegularizeRequestTransaction.EVENT_FEES,
    },
    bookingFees: {
      resolve: RegularizeRequestTransaction => RegularizeRequestTransaction.BOOKING_FEES,
    },
  },
  RegularizeRequest: {
    userId: regularizeRequestUserFieldResolver,
  },
};

module.exports = regularizationFieldResolvers;
