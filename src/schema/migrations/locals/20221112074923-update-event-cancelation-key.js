/* eslint-disable no-unused-vars */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.sequelize.query(`UPDATE configurations
    SET key = 'EVENT_CANCELATION_PERCENTAGES'
    WHERE "key" = 'VENT_CANCELATION_PERCENTAGES'`),
  ]),
};
