const { SUCCESS } = require('../../../../../constants/service-constants');
const clearUserNotificationsService = require('../../../../../modules/notification/services/clear-user-notifications-service');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');
const notificationLogger = require('../../notifications-logger');

const clearUserNotifications = async (req, res, next) => {
  try {
    const { user: { id: userId }, body: { id: notificationIds = [] } = {} } = req;

    await clearUserNotificationsService(userId, notificationIds);
    return sendSuccessResponse(res, SUCCESS, OK);
  } catch (error) {
    notificationLogger(`Error from clearing user notifications: ${error}`, null, 'error');
    return next(error);
  }
};

module.exports = clearUserNotifications;
