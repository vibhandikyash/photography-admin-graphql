/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn('role_module', 'no_access', { type: Sequelize.BOOLEAN, defaultValue: false }),
  ]),
};
