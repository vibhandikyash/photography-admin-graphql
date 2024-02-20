const { check } = require('express-validator');

const { getMessage } = require('../../../utils/messages');

const createChatValidator = [
  check('eventId')
    .notEmpty()
    .withMessage(getMessage('EVENT_ID_REQUIRED')),
  check('receiverId')
    .notEmpty()
    .withMessage(getMessage('RECEIVER_ID_REQUIRED')),
];

const sendMessageValidator = [
  check('message')
    .notEmpty()
    .withMessage(getMessage('MESSAGE_IS_REQUIRED')),
];

module.exports = {
  createChatValidator,
  sendMessageValidator,
};

