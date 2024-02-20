module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('user_reviews', 'status', {
      type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    });
  },
  async down(queryInterface) {
    queryInterface.removeColumn('user_reviews', 'status');
  },
};
