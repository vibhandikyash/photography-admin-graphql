const {
  NOTIFICATION_REF_TYPES: { TOP_UP_REQUEST },
  NOTIFICATION_TYPES: { TOP_UP_REQUEST_APPROVED_RECRUITER },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

// SEND NOTIFICATION TO FREELANCER
const createNotificationForSuccessfulPaymentToFreelancer = async (userId, topUpRequest, senderFullName, localeService) => {
  try {
    const { amount, id: topUpRequestId, senderId } = topUpRequest;
    const title = getMessage('CASH_PAYMENT_SUCCESSFUL_TITLE', localeService);
    const message = getMessage('CASH_PAYMENT_SUCCESSFUL_MESSAGE_TO_FREELANCER', localeService, { amount, senderFullName });

    const pushData = {
      title,
      content: message,
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: userId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: TOP_UP_REQUEST_APPROVED_RECRUITER,
      receiverId: userId,
      senderId,
      refId: topUpRequestId,
      refType: TOP_UP_REQUEST,
      refData: topUpRequest,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for successful payment to freelancer : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForSuccessfulPaymentToFreelancer;
