/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => queryInterface.sequelize.transaction(t => Promise.all([
    queryInterface.addColumn('cities', 'is_featured',
      { type: Sequelize.BOOLEAN, default: false },
      { transaction: t }),
    queryInterface.addColumn('cities', 'asset_url',
      { type: Sequelize.STRING, allowNull: true },
      { transaction: t }),
  ])),

  down: async queryInterface => queryInterface.sequelize.transaction(t => Promise.all([
    queryInterface.removeColumn('cities', 'is_featured', { transaction: t }),
    queryInterface.removeColumn('cities', 'asset_url', { transaction: t }),
  ])),
};
