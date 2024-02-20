module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.sequelize.query(`update configurations
    set "value" = '50' where "key" = 'EVENT_CANCELATION_PERCENTAGES'`),
  ]),
};
