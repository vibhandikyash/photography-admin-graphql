/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add create colum commands.
     */
    return queryInterface.sequelize.transaction(t => Promise.all([

      queryInterface.addColumn('user_type', 'level', { type: Sequelize.INTEGER, allowNull: true }, { transaction: t }),

    ]));
  },

  async down(queryInterface) {
    /**
     * Add reverting commands.
     */
    return queryInterface.sequelize.transaction(t => Promise.all([

      queryInterface.removeColumn('user_type', 'level', { transaction: t }),

    ]));
  },
};
