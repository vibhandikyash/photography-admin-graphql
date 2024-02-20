const { NOTIFICATION_TYPES: { FREELANCER_REMOVED }, NOTIFICATION_REF_TYPES: { EVENT } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForEventCancellationByFreelancer = async (userId, event, freelancerId, localeService) => {
  try {
    const { id: eventId, name: eventName } = event;
    const title = getMessage('FREELANCER_REMOVED_TITLE_FOR_FREELANCER', localeService);
    const message = getMessage('FREELANCER_REMOVED_MESSAGE_FOR_FREELANCER', localeService, { eventName });

    const pushData = {
      title,
      content: message,
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: freelancerId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: FREELANCER_REMOVED,
      refId: eventId,
      senderId: userId,
      receiverId: freelancerId,
      refType: EVENT,
      refData: event,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for event cancellation by freelancer : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForEventCancellationByFreelancer;
