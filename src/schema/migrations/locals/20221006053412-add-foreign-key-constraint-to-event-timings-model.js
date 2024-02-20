/* eslint-disable max-len */

// eslint-disable-next-line filenames-simple/naming-convention
module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.addConstraint('event_timings', {
      fields: ['event_id'],
      type: 'foreign key',
      name: 'event_otp_event_id_fkey',
      references: {
        table: 'event',
        field: 'id',
      },
    }),
  ]),
};
