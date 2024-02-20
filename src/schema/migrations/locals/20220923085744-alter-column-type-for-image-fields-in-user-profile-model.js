/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.changeColumn('user_profile', 'profile_photo', { type: Sequelize.TEXT, allowNull: true }),
    queryInterface.changeColumn('user_profile', 'cover_photo', { type: Sequelize.TEXT, allowNull: true }),
    queryInterface.changeColumn('user_profile', 'aadhar_card_front', { type: Sequelize.TEXT, allowNull: true }),
    queryInterface.changeColumn('user_profile', 'aadhar_card_back', { type: Sequelize.TEXT, allowNull: true }),
  ]),
};
