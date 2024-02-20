const {
  NOTIFICATION_REF_TYPES: { REGULARIZE_REQUEST },
  NOTIFICATION_TYPES: { REGULARIZATION_REQUEST_APPROVED },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel, Event: EventModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForRegularizeRequestApprovalToFreelancer = async (userId, regularizeRequest, isTransactionUpdated, localeService) => {
  try {
    const { id: regularizeRequestId, eventId, userId: freelancerId } = regularizeRequest;
    const event = await EventModel.findByPk(eventId);
    const { leadType } = event;
    let title;
    let message;
    let additionalData;
    if (isTransactionUpdated) {
      title = getMessage('REGULARIZATION_REQUEST_UPDATED_FEES_TITLE_FOR_FREELANCER', localeService);
      message = getMessage('REGULARIZATION_REQUEST_UPDATED_FEES_MESSAGE_FOR_FREELANCER', localeService);
      additionalData = { userId: freelancerId, notificationType: REGULARIZATION_REQUEST_APPROVED };
    } else {
      title = getMessage('REGULARIZATION_REQUEST_APPROVAL_TITLE', localeService);
      message = getMessage('REGULARIZATION_REQUEST_APPROVAL_MESSAGE_FOR_FREELANCER', localeService);
      additionalData = { eventId, eventType: leadType, notificationType: REGULARIZATION_REQUEST_APPROVED };
    }

    const pushData = {
      title,
      content: message,
      additionalData,
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: freelancerId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: REGULARIZATION_REQUEST_APPROVED,
      receiverId: freelancerId,
      senderId: userId,
      refId: regularizeRequestId,
      refData: regularizeRequest,
      refType: REGULARIZE_REQUEST,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for regularize request approval to freelancer: ${error}`, null, 'error');
  }
};

module.exports = createNotificationForRegularizeRequestApprovalToFreelancer;
