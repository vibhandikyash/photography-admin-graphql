const { check } = require('express-validator');

const { getMessage } = require('../../../utils/messages');

const regularizeRequest = [
  check('startDate')
    .notEmpty()
    .withMessage(getMessage('START_DATE_IS_REQUIRED'))
    .isISO8601()
    .toDate()
    .withMessage(getMessage('INVALID_DATE_PROVIDED')),
  check('endDate')
    .notEmpty()
    .withMessage(getMessage('END_DATE_IS_REQUIRED'))
    .isISO8601()
    .toDate()
    .withMessage(getMessage('INVALID_DATE_PROVIDED')),
  check('eventTimingId')
    .notEmpty()
    .withMessage(getMessage('EVENT_TIMING_ID_IS_REQUIRED'))
    .isUUID()
    .withMessage(getMessage('INVALID_UUID_PROVIDED')),
];

module.exports = {
  regularizeRequestValidator: regularizeRequest,
};
