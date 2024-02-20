const { SUCCESS } = require('../../../../../constants/service-constants');
const getNotificationsService = require('../../../../../modules/notification/services/get-notifications-service');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');
const notificationLogger = require('../../notifications-logger');

const getNotifications = async (req, res, next) => {
  try {
    const { query = {}, user } = req;
    const { notificationsCount, notifications } = await getNotificationsService(user, query);
    const result = { count: notificationsCount, notifications };
    return sendSuccessResponse(res, SUCCESS, OK, result);
  } catch (error) {
    notificationLogger(`Error from getting notifications-list: ${error}`, null, 'error');
    return next(error);
  }
};

module.exports = getNotifications;
