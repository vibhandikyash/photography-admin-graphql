const { SUCCESS } = require('../../../constants/service-constants');
const { getMessage } = require('../../../utils/messages');
const notificationLogger = require('../notification-logger');

const removeAdminNotification = async (_, args, ctx) => {
  try {
    const { models: { Notification: NotificationModel }, localeService } = ctx;
    const { id } = args;

    await NotificationModel.destroy({ where: { id } });

    const response = {
      status: SUCCESS,
      message: getMessage('ADMIN_NOTIFICATION_REMOVED', localeService),
    };

    return response;
  } catch (error) {
    notificationLogger(`Error while remove admin notification : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = removeAdminNotification;
