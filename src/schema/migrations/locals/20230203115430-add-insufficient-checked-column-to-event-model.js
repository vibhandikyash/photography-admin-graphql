module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('events', 'is_insufficient_hours_checked', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },
  async down(queryInterface) {
    queryInterface.removeColumn('events', 'is_insufficient_hours_checked');
  },
};
