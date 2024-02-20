const {
  NOTIFICATION_REF_TYPES: { TOP_UP_REQUEST },
  NOTIFICATION_TYPES: { TOP_UP_REQUEST_RECEIVED },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForPaymentConfirmationFromFreelancer = async (user, freelancerId, topUpRequestData, localeService) => {
  try {
    const { id: userId, fullName } = user;
    const { id: topUpRequestId } = topUpRequestData;
    const title = getMessage('CONFIRM_CASH_PAYMENT_TITLE', localeService);
    const message = getMessage('CONFIRM_CASH_PAYMENT_MESSAGE', localeService, { fullName });

    const pushData = {
      title,
      content: message,
      additionalData: { notificationType: TOP_UP_REQUEST_RECEIVED },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: freelancerId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: TOP_UP_REQUEST_RECEIVED,
      receiverId: freelancerId,
      senderId: userId,
      refId: topUpRequestId,
      refType: TOP_UP_REQUEST,
      refData: topUpRequestData,
      actionRequired: true,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for payment confirmation from freelancer : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForPaymentConfirmationFromFreelancer;
