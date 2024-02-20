/* eslint-disable filenames-simple/naming-convention */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cities', 'order',
      { type: Sequelize.INTEGER, defaultValue: 9999 });

    // Added custom order #DEV-27612
    await queryInterface.sequelize.query(`UPDATE "cities"
      SET "order"  = CASE "name"
                         WHEN 'Delhi' THEN 1
                         WHEN 'Mumbai' THEN 2
                         WHEN 'Ahmedabad' THEN 3
                         ELSE "order"
                         END
    WHERE "country_code" = 'IN'`);
  },
  async down(queryInterface) {
    queryInterface.removeColumn('cities', 'order');
  },
};

