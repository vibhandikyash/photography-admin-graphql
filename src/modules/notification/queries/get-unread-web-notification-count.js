const notificationLogger = require('../notification-logger');
const getUnreadNotificationsCountService = require('../services/get-unread-notification-count-service');

const getUnreadWebNotificationCount = async (_, args, ctx) => {
  try {
    const { req: { user = {} } } = ctx;

    const unReadNotificationsCount = await getUnreadNotificationsCountService(user);
    const response = { count: unReadNotificationsCount };
    return response;
  } catch (error) {
    notificationLogger(`Error while get unread web notification count : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getUnreadWebNotificationCount;
