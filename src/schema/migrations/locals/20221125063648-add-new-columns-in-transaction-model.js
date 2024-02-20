module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('transactions', 'freelancer_id', { type: Sequelize.UUID, allowNull: true });
    queryInterface.addColumn('transactions', 'group_id', { type: Sequelize.UUID, allowNull: true });
    queryInterface.addColumn('transactions', 'parent_id', { type: Sequelize.UUID, allowNull: true });
    queryInterface.addColumn('transactions', 'tag', { type: Sequelize.STRING, allowNull: true });
    queryInterface.addColumn('transactions', 'meta_data', { type: Sequelize.JSONB, allowNull: true });
  },
  async down(queryInterface) {
    queryInterface.removeColumn('transactions', 'freelancer_id');
    queryInterface.removeColumn('transactions', 'group_id');
    queryInterface.removeColumn('transactions', 'parent_id');
    queryInterface.removeColumn('transactions', 'tag');
    queryInterface.removeColumn('transactions', 'meta_data');
  },
};
