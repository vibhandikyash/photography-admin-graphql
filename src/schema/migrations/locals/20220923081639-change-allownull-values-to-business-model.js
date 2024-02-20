/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.changeColumn('user_business', 'city', { type: Sequelize.STRING, allowNull: true }),
    queryInterface.changeColumn('user_business', 'state', { type: Sequelize.STRING, allowNull: true }),
    queryInterface.changeColumn('user_business', 'country', { type: Sequelize.STRING, allowNull: true }),
    queryInterface.changeColumn('user_business', 'zip_code', { type: Sequelize.STRING, allowNull: true }),
  ]),
};
