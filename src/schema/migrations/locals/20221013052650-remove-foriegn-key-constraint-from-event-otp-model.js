/* eslint-disable max-len */
/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: queryInterface => queryInterface.removeConstraint('event_otp', 'event_otp_event_timings_id_fkey').then(() => queryInterface.addConstraint('event_otp', {
    fields: ['event_timings_id'],
    type: 'foreign key',
    name: 'event_otp_event_timings_id_fkey_constraint',
    references: {
      table: 'event_timings',
      field: 'id',
    },
  })),
};
