module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('users', 'time_zone', { type: Sequelize.STRING, allowNull: true, defaultValue: 'Asia/Kolkata' });
    queryInterface.addColumn('events', 'time_zone', { type: Sequelize.STRING, allowNull: true, defaultValue: 'Asia/Kolkata' });
  },
  async down(queryInterface) {
    queryInterface.removeColumn('users', 'time_zone');
    queryInterface.removeColumn('events', 'time_zone');
  },
};
