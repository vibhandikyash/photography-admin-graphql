const { TOP_UP } = require('../../../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../../../sequelize-client');
const eventLogger = require('../../../events/event-logger');

const getPaymentsAmount = async userId => {
  try {
    const replacements = {
      userId,
      transactionTypes: [TOP_UP],
    };

    // get services sum
    const query = 'select sum(amount) from transactions where user_id = :userId and transaction_type in (:transactionTypes)';

    const [{ sum: paymentsAmount }] = await sequelize.query(query, { replacements, type: Sequelize.QueryTypes.SELECT });

    return paymentsAmount;
  } catch (error) {
    eventLogger(`Error from get-payments-amount: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getPaymentsAmount;
