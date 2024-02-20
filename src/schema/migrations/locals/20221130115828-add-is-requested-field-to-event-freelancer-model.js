/* eslint-disable filenames-simple/naming-convention */

module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('event_freelancers', 'is_requested',
      { type: Sequelize.BOOLEAN, defaultValue: false });
  },
  async down(queryInterface) {
    queryInterface.removeColumn('event_freelancers', 'is_requested');
  },
};
