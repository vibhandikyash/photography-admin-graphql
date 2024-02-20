/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    queryInterface.addColumn('regularize_requests', 'ticket_no', { type: Sequelize.INTEGER, autoIncrement: true });
  },

  down: async queryInterface => {
    queryInterface.removeColumn('regularize_requests', 'ticket_no');
  },
};
