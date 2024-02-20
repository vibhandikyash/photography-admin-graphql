/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.changeColumn('user', 'user_name', { type: Sequelize.STRING, allowNull: true }),
  ]),
};
