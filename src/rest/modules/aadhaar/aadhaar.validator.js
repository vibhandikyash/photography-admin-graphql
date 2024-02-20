const { check } = require('express-validator');

const updateAadhaar = [
  check('front')
    .notEmpty()
    .withMessage('Aadhaar front is required'),
  check('back')
    .notEmpty()
    .withMessage('Aadhaar back is required'),
];

module.exports = {
  updateAadhaarValidation: updateAadhaar,
};
