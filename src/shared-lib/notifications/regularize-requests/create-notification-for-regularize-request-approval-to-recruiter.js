const {
  NOTIFICATION_REF_TYPES: { REGULARIZE_REQUEST },
  NOTIFICATION_TYPES: { REGULARIZATION_REQUEST_APPROVED },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel, Event: EventModel, User: UserModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForRegularizeRequestApprovalToRecruiter = async (userId, regularizeRequest, isTransactionUpdated, localeService) => {
  try {
    const { id: regularizeRequestId, eventId, userId: freelancerId } = regularizeRequest;
    const event = await EventModel.findByPk(eventId);
    const user = await UserModel.findByPk(freelancerId);
    const { fullName: freelancerName } = user;
    const { leadType, recruiterId } = event;
    let title;
    let message;
    if (isTransactionUpdated) {
      title = getMessage('REGULARIZATION_REQUEST_UPDATED_FEES_TITLE_FOR_RECRUITER', localeService);
      message = getMessage('REGULARIZATION_REQUEST_UPDATED_FEES_MESSAGE_FOR_RECRUITER', localeService, { freelancerName });
    } else {
      title = getMessage('REGULARIZATION_REQUEST_APPROVAL_TITLE', localeService);
      message = getMessage('REGULARIZATION_REQUEST_APPROVAL_MESSAGE_FOR_RECRUITER', localeService, { freelancerName });
    }

    const pushData = {
      title,
      content: message,
      additionalData: { eventId, eventType: leadType, notificationType: REGULARIZATION_REQUEST_APPROVED },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: recruiterId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: REGULARIZATION_REQUEST_APPROVED,
      receiverId: recruiterId,
      senderId: userId,
      refId: regularizeRequestId,
      refData: regularizeRequest,
      refType: REGULARIZE_REQUEST,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for regularize request approval to recruiter : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForRegularizeRequestApprovalToRecruiter;
