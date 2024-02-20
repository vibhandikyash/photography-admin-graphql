/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.changeColumn('user_profiles', 'average_rating', { type: Sequelize.FLOAT, allowNull: true }),
  ]),
};
