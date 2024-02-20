/* eslint-disable security/detect-non-literal-fs-filename */

const { check } = require('express-validator');

const {
  APPROVED,
  REJECTED,
  MODE_OF_PAYMENT: { CASH, ONLINE },
  TOP_UP_REQUEST: { MIN_VALUE, MAX_VALUE },
} = require('../../../constants/service-constants');

const { getMessage } = require('../../../utils/messages');

const topUpRequests = [
  check('amount')
    .notEmpty()
    .withMessage(getMessage('AMOUNT_IS_REQUIRED'))
    .isFloat()
    .withMessage(getMessage('AMOUNT_SHOULD_BE_INTEGER'))
    .isFloat({ min: MIN_VALUE, max: MAX_VALUE })
    .withMessage(getMessage('AMOUNT_SHOULD_BE_IN_RANGE_OF_200000')),
  check('modeOfPayment')
    .notEmpty()
    .withMessage(getMessage('PAYMENT_MODE_IS_REQUIRED'))
    .isIn([CASH, ONLINE])
    .withMessage(getMessage('PAYMENT_MODE_SHOULD_BE_CASH_OR_ONLINE')),
  check('freelancerId')
    .notEmpty()
    .withMessage(getMessage('FREELANCER_ID_IS_REQUIRED'))
    .isUUID()
    .withMessage(getMessage('INVALID_UUID_PROVIDED')),
  check('eventId')
    .notEmpty()
    .withMessage(getMessage('EVENT_ID_IS_REQUIRED'))
    .isUUID()
    .withMessage(getMessage('INVALID_UUID_PROVIDED')),
];

const topUpRequestsApproval = [
  check('status')
    .notEmpty()
    .withMessage(getMessage('STATUS_IS_REQUIRED'))
    .isIn([APPROVED, REJECTED])
    .withMessage(getMessage('STATUS_IS_INVALID')),
];

module.exports = {
  topUpRequestsValidator: topUpRequests,
  topUpRequestsApprovalValidator: topUpRequestsApproval,
};

