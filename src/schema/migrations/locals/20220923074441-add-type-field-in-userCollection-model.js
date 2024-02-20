/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn('user_collection', 'type', { type: Sequelize.ENUM('IMAGE', 'VIDEO'), defaultValue: 'IMAGE' }),
  ]),
};
