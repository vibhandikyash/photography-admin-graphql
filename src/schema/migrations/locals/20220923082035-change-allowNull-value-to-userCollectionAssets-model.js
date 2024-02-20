/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.changeColumn('user_collection_assets', 'title', { type: Sequelize.STRING, allowNull: true }),
  ]),
};
