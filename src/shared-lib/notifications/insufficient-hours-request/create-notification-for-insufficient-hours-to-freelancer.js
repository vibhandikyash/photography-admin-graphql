const { NOTIFICATION_TYPES: { INSUFFICIENT_WORKING_HOURS }, NOTIFICATION_REF_TYPES: { EVENT } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForInsufficientHoursToFreelancer = async (freelancerId, event) => {
  try {
    const { id: eventId, leadType } = event;
    const title = getMessage('INSUFFICIENT_HOURS_REQUEST_TITLE_FOR_FREELANCER');
    const message = getMessage('INSUFFICIENT_HOURS_REQUEST_MESSAGE_FOR_FREELANCER');

    const pushData = {
      title,
      content: message,
      additionalData: { eventId, eventType: leadType, notificationType: INSUFFICIENT_WORKING_HOURS },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: freelancerId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: INSUFFICIENT_WORKING_HOURS,
      receiverId: freelancerId,
      refId: eventId,
      refType: EVENT,
      refData: event,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for insufficient hours request to freelancer: ${error}`, null, 'error');
  }
};

module.exports = createNotificationForInsufficientHoursToFreelancer;
