/* eslint-disable filenames-simple/naming-convention */

module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('disputes', 'ticket_no',
      { type: Sequelize.INTEGER, allowNull: false });
  },

  async down(queryInterface) {
    queryInterface.removeColumn('disputes', 'ticket_no');
  },
};
