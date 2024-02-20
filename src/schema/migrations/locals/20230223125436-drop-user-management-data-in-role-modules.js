/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query('DELETE FROM role_modules WHERE "module_key" = \'USER_MANAGEMENT\'');
  },
};
