const { check } = require('express-validator');

const { OTP } = require('../../../config/config');

const register = [
  check('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 4 })
    .withMessage('Name must be at least 4 characters long'),
  check('countryCode')
    .notEmpty()
    .withMessage('Country code is required'),
  check('contactNo')
    .notEmpty()
    .withMessage('Phone no is required')
    .isMobilePhone()
    .withMessage('Invalid mobile number'),
  check('email')
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  check('role')
    .isIn(['FREELANCER', 'RECRUITER'])
    .withMessage('Invalid role'),
];

const login = [
  check('contactNo')
    .notEmpty()
    .withMessage('Phone no is required')
    .isMobilePhone()
    .withMessage('Invalid mobile number'),
];

const otp = [
  check('contactNo')
    .notEmpty()
    .withMessage('Phone no is required')
    .isMobilePhone()
    .withMessage('Invalid mobile number'),
  check('otp')
    .notEmpty()
    .withMessage('Otp is required')
    .isLength({ min: OTP.LENGTH })
    .withMessage('Invalid otp'),
];

module.exports = {
  registerValidator: register,
  loginValidator: login,
  otpValidator: otp,
};
