const express = require('express');

const { createChatValidator, sendMessageValidator } = require('../chats.validator');

const createChat = require('./controllers/create-chat');
const getMessageCount = require('./controllers/get-message-count');
const sendMessage = require('./controllers/send-message');
const viewChat = require('./controllers/view-chat');

const router = express.Router();

router.post('/', createChatValidator, createChat);
router.post('/:chatGroupId/messages', sendMessageValidator, sendMessage);
router.get('/:chatGroupId/messages', viewChat);
router.get('/:chatGroupId/messages/count', getMessageCount);

module.exports = router;
