/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.sequelize.query('update user_type set level = 1 where key = \'PREMIUM\''),
    queryInterface.sequelize.query('update user_type set level = 2 where key = \'WEDLANCER_ASSURED\''),
    queryInterface.sequelize.query('update user_type set level = 3 where key = \'FREE\''),
  ]),
};
