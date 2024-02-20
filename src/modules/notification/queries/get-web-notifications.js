const notificationLogger = require('../notification-logger');
const getNotificationsService = require('../services/get-notifications-service');

const getWebNotifications = async (_, args, ctx) => {
  try {
    const { req: { user } } = ctx;
    const { filter = {} } = args;

    const { notificationsCount, notifications } = await getNotificationsService(user, filter);
    const response = { count: notificationsCount, notifications };
    return response;
  } catch (error) {
    notificationLogger(`Error from getWebNotifications: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getWebNotifications;
