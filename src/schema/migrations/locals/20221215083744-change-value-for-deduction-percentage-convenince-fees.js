module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.sequelize.query(`update configurations
    set "value" = '20' where "key" = 'FREELANCER_DEDUCTION_PERCENTAGE'`),
    queryInterface.sequelize.query(`update configurations
    set "value" = '449' where "key" = 'CONVENIENCE_FEES'`),
  ]),
};
