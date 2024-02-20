const express = require('express');

const clearUserNotifications = require('./controllers/clear-user-notifications');
const getUnreadNotificationsCount = require('./controllers/get-unread-notifications-count');
const notifications = require('./controllers/notifications');

const router = express.Router();

router.get('/', notifications);
router.get('/unread-count', getUnreadNotificationsCount);
router.delete('/clear', clearUserNotifications);

module.exports = router;
