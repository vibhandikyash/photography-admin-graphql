const { check } = require('express-validator');

const upfront = [
  check('location')
    .notEmpty()
    .withMessage('Location is required'),
  check('categories')
    .notEmpty()
    .withMessage('Categories is required'),
];

const organic = [
  check('freelancerId')
    .notEmpty()
    .withMessage('freelancerId is required'),
  check('name')
    .notEmpty()
    .withMessage('Name is required'),
  check('location')
    .notEmpty()
    .withMessage('Location is required'),
  check('startDate')
    .notEmpty()
    .withMessage('Start date is required'),
  check('endDate')
    .notEmpty()
    .withMessage('End date is required'),
];

const timings = [
  check('eventId')
    .notEmpty()
    .withMessage('Event id is required'),
  check('timings')
    .notEmpty()
    .withMessage('timings are required for the event dates'),
];

const freelancerRating = [
  check('eventId')
    .notEmpty()
    .withMessage('Event id is required'),
  check('freelancerId')
    .notEmpty()
    .withMessage('Freelancer id is required'),
  check('communicationRating')
    .notEmpty()
    .withMessage('Communication Rating is required'),
  check('communicationRating')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Communication Rating should be between 0 and 5'),
  check('punctualityRating')
    .notEmpty()
    .withMessage('Punctuality rating is required'),
  check('punctualityRating')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Punctuality Rating should be between 0 and 5'),
  check('overAllRating')
    .notEmpty()
    .withMessage('Overall service rating is required'),
  check('overAllRating')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Overall service rating should be between 0 and 5'),
];

const recruiterRating = [
  check('eventId')
    .notEmpty()
    .withMessage('Event id is required'),
  check('recruiterId')
    .notEmpty()
    .withMessage('Recruiter id is required'),
  check('communicationRating')
    .notEmpty()
    .withMessage('Communication Rating is required'),
  check('communicationRating')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Communication Rating should be between 0 and 5'),
  check('punctualityRating')
    .notEmpty()
    .withMessage('Punctuality rating is required'),
  check('punctualityRating')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Punctuality Rating should be between 0 and 5'),
  check('overAllRating')
    .notEmpty()
    .withMessage('Overall service rating is required'),
  check('overAllRating')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Overall service rating should be between 0 and 5'),
];

module.exports = {
  upfrontEventValidator: upfront,
  organicEventValidator: organic,
  addEventTimings: timings,
  freelancerRatingValidator: freelancerRating,
  recruiterRatingValidator: recruiterRating,
};

