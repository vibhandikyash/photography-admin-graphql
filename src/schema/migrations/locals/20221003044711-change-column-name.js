/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  async up(queryInterface) {
    /**
     * Add altering commands.
     */
    return queryInterface.sequelize.transaction(t => Promise.all([

      queryInterface.renameColumn('user_business', 'addressLine1',
        'address_line1', { transaction: t }),

      queryInterface.renameColumn('user_business', 'addressLine2',
        'address_line2', { transaction: t }),

    ]));
  },

  async down(queryInterface) {
    /**
     * Add reverting commands.
     */
    return queryInterface.sequelize.transaction(t => Promise.all([

      queryInterface.renameColumn('user_business', 'addressLine1',
        'address_line1', { transaction: t }),

      queryInterface.renameColumn('user_business', 'addressLine2',
        'address_line2', { transaction: t }),

    ]));
  },
};
