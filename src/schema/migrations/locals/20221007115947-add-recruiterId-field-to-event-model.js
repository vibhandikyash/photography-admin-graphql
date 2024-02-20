/* eslint-disable max-len */
/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('event', 'recruiter_id', { type: Sequelize.UUID, allowNull: true }).then(() => queryInterface.addConstraint('event', {
    fields: ['recruiter_id'],
    type: 'foreign key',
    name: 'event_recruiter_id_timings_id_fkey',
    references: {
      table: 'user',
      field: 'id',
    },
  })),
};
