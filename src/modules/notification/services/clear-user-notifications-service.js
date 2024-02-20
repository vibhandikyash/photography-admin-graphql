const { Notification: NotificationModel } = require('../../../sequelize-client');
const notificationLogger = require('../notification-logger');

const clearUserNotificationsService = async (userId, notificationIds = []) => {
  try {
    let condition = { actionRequired: false };
    if (notificationIds.length) {
      condition = { ...condition, id: notificationIds, receiverId: userId };
    } else {
      condition = { ...condition, receiverId: userId };
    }
    await NotificationModel.destroy({ where: condition });
  } catch (error) {
    notificationLogger(`Error from clearing user notifications service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = clearUserNotificationsService;
