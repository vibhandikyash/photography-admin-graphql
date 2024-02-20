const { check } = require('express-validator');

const otpVerification = [
  check('eventId')
    .notEmpty()
    .withMessage('Event id is required'),
  check('otp')
    .notEmpty()
    .withMessage('OTP is required'),
];

const listFreelancers = [
  check('location')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Invalid input for location'),
];

const eventClockOut = [
  check('id')
    .notEmpty()
    .withMessage('ID is required'),
];

module.exports = {
  listFreelancersValidator: listFreelancers,
  otpVerificationValidator: otpVerification,
  eventClockOutValidator: eventClockOut,
};

