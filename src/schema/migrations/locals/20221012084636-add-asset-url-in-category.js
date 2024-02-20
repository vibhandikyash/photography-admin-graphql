/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add create colum commands.
     */
    return queryInterface.sequelize.transaction(t => Promise.all([

      queryInterface.addColumn('category', 'url', { type: Sequelize.STRING, allowNull: true }, { transaction: t }),

    ]));
  },

  async down(queryInterface) {
    /**
     * Add reverting commands.
     */
    return queryInterface.sequelize.transaction(t => Promise.all([

      queryInterface.removeColumn('category', 'url', { transaction: t }),

    ]));
  },
};
