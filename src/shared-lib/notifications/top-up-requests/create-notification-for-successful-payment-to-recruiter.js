const {
  NOTIFICATION_REF_TYPES: { TOP_UP_REQUEST },
  NOTIFICATION_TYPES: { TOP_UP_REQUEST_APPROVED_FREELANCER },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

// SEND NOTIFICATION TO THE RECRUITER
const createNotificationForSuccessfulPaymentToRecruiter = async (userId, topUpRequest, localeService) => {
  try {
    const { amount, id: topUpRequestId, senderId } = topUpRequest;
    const title = getMessage('CASH_PAYMENT_SUCCESSFUL_TITLE', localeService);
    const message = getMessage('CASH_PAYMENT_SUCCESSFUL_MESSAGE_TO_RECRUITER', localeService, { amount });

    const pushDataToRecruiter = {
      title,
      content: message,
      additionalData: { userId: senderId, notificationType: TOP_UP_REQUEST_APPROVED_FREELANCER },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: senderId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: TOP_UP_REQUEST_APPROVED_FREELANCER,
      receiverId: senderId,
      senderId: userId,
      refId: topUpRequestId,
      refType: TOP_UP_REQUEST,
      refData: topUpRequest,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushDataToRecruiter);
  } catch (error) {
    defaultLogger(`Error from creating notification for successful payment to recruiter: ${error}}`, null, 'error');
  }
};

module.exports = createNotificationForSuccessfulPaymentToRecruiter;
