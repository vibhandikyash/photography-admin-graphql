/* eslint-disable filenames-simple/naming-convention */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('categories', 'order',
      { type: Sequelize.INTEGER, defaultValue: 99 });

    // Added custom order #DEV-27613
    await queryInterface.sequelize.query(`UPDATE "categories"
      SET "order"  = CASE "name"
                         WHEN 'PHOTOGRAPHER' THEN 1
                         WHEN 'CINEMATOGRAPHER' THEN 2
                         when 'AERIAL CINEMATOGRAPHER' then 3
                         when 'VIDEO EDITOR' then 4
                         ELSE "order"
                         END
    WHERE "name"  IN('PHOTOGRAPHER','CINEMATOGRAPHER','AERIAL CINEMATOGRAPHER','VIDEO EDITOR')`);
  },
  async down(queryInterface) {
    queryInterface.removeColumn('categories', 'order');
  },
};

