const {
  REFUND, ADDITIONAL_BOOKING_FEES, BOOKING_FEES, CANCELLATION_CHARGES, WAIVE_OFF, CONFIGURATION_KEYS,
} = require('../../../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../../../sequelize-client');
const eventLogger = require('../../../events/event-logger');

const getServicesAmount = async userId => {
  try {
    const replacements = {
      userId,
      typesToAdd: [REFUND, WAIVE_OFF],
      typesToDeduct: [BOOKING_FEES, CANCELLATION_CHARGES, CONFIGURATION_KEYS.CONVENIENCE_FEES, ADDITIONAL_BOOKING_FEES],
    };

    // get services sum
    const query = `select
      sum(case
        when transaction_type in (:typesToAdd) then
          amount
        when transaction_type in (:typesToDeduct) then
          -amount
        else
          0
      end) from transactions where user_id = :userId`;

    const [{ sum: servicesAmount }] = await sequelize.query(query, { replacements, type: Sequelize.QueryTypes.SELECT });

    return servicesAmount;
  } catch (error) {
    eventLogger(`Error from get-services-amount: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getServicesAmount;
