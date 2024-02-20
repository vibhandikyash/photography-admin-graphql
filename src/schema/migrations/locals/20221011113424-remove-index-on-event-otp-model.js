/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.removeIndex('event_otp', 'event_otp_event_id'),
  ]),
};
