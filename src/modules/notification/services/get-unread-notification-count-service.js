const { IN_APP_NOTIFICATION_TYPES_FOR_FREELANCER, IN_APP_NOTIFICATION_TYPES_FOR_RECRUITER } = require('../../../constants/service-constants');
const notificationLogger = require('../../../rest/modules/notifications/notifications-logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');

const getUnreadNotificationsCountService = async (user = {}) => {
  try {
    const { id: userId, role } = user;
    const notificationType = {
      FREELANCER: IN_APP_NOTIFICATION_TYPES_FOR_FREELANCER,
      RECRUITER: IN_APP_NOTIFICATION_TYPES_FOR_RECRUITER,
    };

    const unReadNotificationsCount = await NotificationModel.count({ where: { type: notificationType[role], receiverId: userId, hasRead: false } });
    return unReadNotificationsCount;
  } catch (error) {
    notificationLogger(`Error from getting unread notifications count service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getUnreadNotificationsCountService;
