const clearWebNotifications = require('./mutations/clear-web-notifications');
const removeAdminNotification = require('./mutations/remove-admin-notification');
const getAdminNotificationList = require('./queries/get-admin-notification-list');
const getUnreadAdminNotificationCount = require('./queries/get-unread-admin-notification-count');
const getUnreadWebNotificationCount = require('./queries/get-unread-web-notification-count');
const getWebNotifications = require('./queries/get-web-notifications');

const resolvers = {
  Query: {
    getUnreadAdminNotificationCount,
    getUnreadWebNotificationCount,
    getAdminNotificationList,
    getWebNotifications,
  },
  Mutation: {
    removeAdminNotification,
    clearWebNotifications,
  },
};

module.exports = resolvers;
