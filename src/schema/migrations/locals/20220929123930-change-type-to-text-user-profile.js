/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.changeColumn('user_profile', 'bio', { type: Sequelize.TEXT, allowNull: true }),
  ]),
};
