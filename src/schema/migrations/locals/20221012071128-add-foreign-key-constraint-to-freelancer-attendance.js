/* eslint-disable max-len */
// eslint-disable-next-line filenames-simple/naming-convention
/* eslint-disable max-len */
/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('freelancer_attendance', 'event_otp_id', { type: Sequelize.UUID, allowNull: true }).then(() => queryInterface.addConstraint('freelancer_attendance', {
    fields: ['event_otp_id'],
    type: 'foreign key',
    name: 'freelancer_attendance_event_otp_id',
    references: {
      table: 'event_otp',
      field: 'id',
    },
  })),
};
