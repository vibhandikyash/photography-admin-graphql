const { check } = require('express-validator');

const updateProfile = [
  check('fullName')
    .notEmpty()
    .withMessage('Name is required'),
  check('zipCode')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('Invalid zip code'),
];

module.exports = {
  updateProfileValidator: updateProfile,
};
