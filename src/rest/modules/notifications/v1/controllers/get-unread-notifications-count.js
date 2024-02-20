const { SUCCESS } = require('../../../../../constants/service-constants');
const getUnreadNotificationsCountService = require('../../../../../modules/notification/services/get-unread-notification-count-service');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');
const notificationLogger = require('../../notifications-logger');

const getUnreadNotificationsCount = async (req, res, next) => {
  try {
    const { user = {} } = req;

    const unReadNotificationsCount = await getUnreadNotificationsCountService(user);
    return sendSuccessResponse(res, SUCCESS, OK, { unReadNotificationsCount });
  } catch (error) {
    notificationLogger(`Error from getting unread notifications count: ${error}`, null, 'error');
    return next(error);
  }
};

module.exports = getUnreadNotificationsCount;
