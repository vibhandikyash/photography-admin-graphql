/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.changeColumn('event_timings', 'start_time', { type: Sequelize.TIME, allowNull: true }),
    queryInterface.changeColumn('event_timings', 'end_time', { type: Sequelize.TIME, allowNull: true }),
  ]),
};
