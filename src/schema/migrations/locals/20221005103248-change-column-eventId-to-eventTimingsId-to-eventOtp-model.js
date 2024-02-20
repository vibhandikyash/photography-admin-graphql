/* eslint-disable max-len */
/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: queryInterface => queryInterface.renameColumn('event_otp', 'event_id', 'event_timings_id').then(() => queryInterface.addConstraint('event_otp', {
    fields: ['event_timings_id'],
    type: 'foreign key',
    name: 'event_otp_event_timings_id_fkey',
    references: {
      table: 'event_timings',
      field: 'id',
    },
  })),
};
