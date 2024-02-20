/* eslint-disable no-unused-vars */
/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.sequelize.query('ALTER TABLE public."transaction" ALTER COLUMN "event_id" DROP NOT NULL'),
  ]),
};
