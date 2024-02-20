/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    queryInterface.changeColumn('upfront_category_requirements', 'count', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });
  },
};
