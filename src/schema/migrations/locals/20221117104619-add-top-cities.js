/* eslint-disable max-len */
/* eslint-disable filenames-simple/naming-convention */

module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query(`UPDATE cities
    SET is_featured  = true
    WHERE country_code='IN' and ("name" ='Delhi' or "name"='Mumbai'  or "name"='Ahmedabad'
    or "name"='Kolkata'  or "name"='Jaipur' or "name"='Surat'or "name"='Indore')`);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(` UPDATE cities
    SET is_featured  = false
    WHERE country_code='IN' and ("name" ='Delhi' or "name"='Mumbai'  or "name"='Ahmedabad'
    or "name"='Kolkata'  or "name"='Jaipur' or "name"='Surat'or "name"='Indore')`);
  },
};
