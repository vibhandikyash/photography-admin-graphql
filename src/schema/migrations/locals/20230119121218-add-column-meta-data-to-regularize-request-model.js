module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('regularize_requests', 'meta_data', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    queryInterface.removeColumn('regularize_requests', 'meta_data');
  },
};
