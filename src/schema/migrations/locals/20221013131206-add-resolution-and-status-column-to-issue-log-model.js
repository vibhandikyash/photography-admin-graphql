/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn('issue_log', 'resolution', { type: Sequelize.TEXT, allowNull: true }),
    queryInterface.addColumn('issue_log', 'status', { type: Sequelize.ENUM('RESOLVED', 'PENDING'), defaultValue: 'PENDING' }),
  ]),
};
