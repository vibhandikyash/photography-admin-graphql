const { getMessage } = require('../../../utils/messages');
const notificationLogger = require('../notification-logger');

const getUnreadAdminNotificationCount = async (_, args, ctx) => {
  try {
    const {
      req: { user: { id } = {} },
      models: { Notification: NotificationModel },
      localeService,
    } = ctx;

    const count = await NotificationModel.count({ where: { receiverId: id, hasRead: false } });

    const response = {
      count,
      message: getMessage('UNREAD_NOTIFICATION_COUNT_FETCHED', localeService),
    };

    return response;
  } catch (error) {
    notificationLogger(`Error while get unread admin notification count : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getUnreadAdminNotificationCount;
