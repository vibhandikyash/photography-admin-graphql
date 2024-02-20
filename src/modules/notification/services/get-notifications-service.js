const { QUERY_PAGING_MAX_COUNT, QUERY_PAGING_MIN_COUNT } = require('../../../config/config');
const { IN_APP_NOTIFICATION_TYPES_FOR_FREELANCER, IN_APP_NOTIFICATION_TYPES_FOR_RECRUITER } = require('../../../constants/service-constants');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const notificationLogger = require('../notification-logger');

const getNotificationsService = async (user = {}, filter = {}) => {
  try {
    const { id: userId, role } = user;
    let { limit = QUERY_PAGING_MIN_COUNT } = filter;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);
    const { skip: offset = 0 } = filter;

    const notificationType = {
      FREELANCER: IN_APP_NOTIFICATION_TYPES_FOR_FREELANCER,
      RECRUITER: IN_APP_NOTIFICATION_TYPES_FOR_RECRUITER,
    };
    const condition = { receiverId: userId, type: notificationType[role] };

    let notifications = await NotificationModel.findAll({
      where: condition,
      attributes: ['id', 'title', 'message', 'createdAt', 'refId', 'refType', 'refData', 'type', 'actionRequired'],
      offset,
      limit,
      order: [['createdAt', 'desc']],
    });
    const notificationsCount = await NotificationModel.count({ where: condition });

    // UPDATE THE NOTIFICATION TO BE READ
    await NotificationModel.update({ hasRead: true }, { where: condition });
    notifications = JSON.parse(JSON.stringify(notifications));
    return { notificationsCount, notifications };
  } catch (error) {
    notificationLogger(`Error from getNotificationsService: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getNotificationsService;
