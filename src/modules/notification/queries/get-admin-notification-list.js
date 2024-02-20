const { map } = require('lodash');

const { Op } = require('sequelize');

const { QUERY_PAGING_MIN_COUNT } = require('../../../config/config');
const notificationLogger = require('../notification-logger');

const getAdminNotificationList = async (_, args, ctx) => {
  try {
    const {
      req: { user: { id } = {} },
      models: { Notification: NotificationModel },
    } = ctx;

    const { filter: { skip: offset = 0, limit = QUERY_PAGING_MIN_COUNT } = {} } = args;

    const count = await NotificationModel.count({ where: { receiverId: id } });

    const data = await NotificationModel.findAll({
      where: { receiverId: id },
      attributes: ['id', 'title', 'message', 'type', 'refType', 'refData', 'hasRead', 'createdAt'],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    // mark notification as read
    const notificationIds = map(data, 'id');
    await NotificationModel.update(
      { hasRead: true },
      {
        where: {
          id: { [Op.in]: notificationIds },
          hasRead: false,
        },
      },
    );

    const response = { count, data };
    return response;
  } catch (error) {
    notificationLogger(`Error while get admin notification list : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getAdminNotificationList;
