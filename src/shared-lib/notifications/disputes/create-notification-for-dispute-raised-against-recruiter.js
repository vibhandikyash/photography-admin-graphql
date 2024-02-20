const { NOTIFICATION_REF_TYPES: { DISPUTE }, NOTIFICATION_TYPES: { DISPUTE_RAISED } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel, Event: EventModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForDisputeRaisedAgainstRecruiter = async (userId, recruiterId, dispute, localeService) => {
  try {
    const { id: disputeId, eventId } = dispute;
    const event = await EventModel.findByPk(eventId);
    const { leadType } = event;
    const title = getMessage('DISPUTE_RAISED_TITLE', localeService);
    const message = getMessage('DISPUTE_RAISED_MESSAGE', localeService);

    const pushData = {
      title,
      content: message,
      additionalData: { eventId, eventType: leadType, notificationType: DISPUTE_RAISED },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: recruiterId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: DISPUTE_RAISED,
      receiverId: recruiterId,
      senderId: userId,
      refId: disputeId,
      refType: DISPUTE,
      refData: dispute,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for dispute raised against recruiter : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForDisputeRaisedAgainstRecruiter;
