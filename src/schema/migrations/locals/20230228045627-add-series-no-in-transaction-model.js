/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    queryInterface.addColumn('transactions', 'series_no', { type: Sequelize.INTEGER, autoIncrement: true });
    queryInterface.addColumn('top_up_requests', 'series_no', { type: Sequelize.INTEGER, autoIncrement: true });
  },

  down: async queryInterface => {
    queryInterface.removeColumn('transactions', 'series_no');
    queryInterface.removeColumn('top_up_requests', 'series_no');
  },
};
