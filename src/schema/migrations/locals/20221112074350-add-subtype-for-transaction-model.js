/* eslint-disable no-unused-vars */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn('transactions', 'transaction_sub_type', {
      type: Sequelize.ENUM('BOOKING_FEES', 'TRAINING_FEES', 'INITIAL_FEES',
        'ADDITIONAL_BOOKING_FEES', 'CANCELLATION_CHARGES', 'TOP_UP', 'CONVENIENCE_FEES', 'EVENT_FEES'),
    }),
  ]),
};
