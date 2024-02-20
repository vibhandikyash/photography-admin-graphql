/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands.
     */
    return queryInterface.sequelize.transaction(t => Promise.all([

      queryInterface.renameColumn('user_business', 'address',
        'addressLine1', { transaction: t }),

      queryInterface.addColumn('user_business', 'addressLine2', {
        type: Sequelize.STRING, allowNull: true,
      }, { transaction: t }),

    ]));
  },

  async down(queryInterface) {
    /**
     * Add reverting commands.
     */
    return queryInterface.sequelize.transaction(t => Promise.all([

      queryInterface.renameColumn('user_business', 'addressLine1',
        'address', { transaction: t }),

      queryInterface.removeColumn('user_business', 'addressLine2', { transaction: t }),

    ]));
  },
};
