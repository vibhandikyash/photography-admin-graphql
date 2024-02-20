/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    queryInterface.changeColumn('events', 'name', { type: Sequelize.STRING, allowNull: true });
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.changeColumn('events', 'name', { type: Sequelize.STRING, allowNull: false });
  },
};
