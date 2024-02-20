const { SUCCESS } = require('../../../constants/service-constants');
const { getMessage } = require('../../../utils/messages');
const notificationLogger = require('../notification-logger');
const clearUserNotificationsService = require('../services/clear-user-notifications-service');

const clearWebNotifications = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } }, localeService } = ctx;
    const { where: { id: notificationIds = [] } = {} } = args;
    await clearUserNotificationsService(userId, notificationIds);
    const response = { status: SUCCESS, message: getMessage('NOTIFICATIONS_REMOVED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    notificationLogger(`Error from clearWebNotifications: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = clearWebNotifications;
