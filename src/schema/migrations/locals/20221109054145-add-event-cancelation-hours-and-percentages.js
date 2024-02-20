/* eslint-disable no-unused-vars */
/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.sequelize.query(`insert into configurations(key,value,created_at,updated_at,deleted_at)
    values ('VENT_CANCELATION_HOURS',48,now(),now(),null),('EVENT_CANCELATION_PERCENTAGES',10,now(),now(),null)`),
  ]),
};
