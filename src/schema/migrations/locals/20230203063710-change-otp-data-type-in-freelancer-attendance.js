/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.changeColumn('freelancer_attendances', 'otp', { type: Sequelize.STRING, allowNull: true }),
  ]),
};
