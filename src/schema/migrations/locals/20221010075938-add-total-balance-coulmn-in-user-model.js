/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn('user', 'total_balance', { type: Sequelize.FLOAT, defaultValue: 0 }),
  ]),
};
