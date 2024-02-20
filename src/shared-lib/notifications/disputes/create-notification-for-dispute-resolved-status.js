const { NOTIFICATION_REF_TYPES: { DISPUTE }, NOTIFICATION_TYPES: { DISPUTE_RESOLVED } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel, Event: EventModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForDisputeResolvedStatus = async (userId, raisedById, raisedForId, dispute, localeService) => {
  try {
    const { id: disputeId, eventId } = dispute;
    const event = await EventModel.findByPk(eventId);
    const { leadType } = event;
    const title = getMessage('DISPUTE_RESOLVED_TITLE', localeService);
    const message = getMessage('DISPUTE_RESOLVED_MESSAGE', localeService);

    const pushDataForDisputeResolvedUser = {
      title,
      content: message,
      additionalData: { eventId, eventType: leadType, notificationType: DISPUTE_RESOLVED },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: raisedById,
      }],
    };

    const pushDataForDisputeResolvedAgainstUser = {
      title,
      content: message,
      additionalData: { eventId, eventType: leadType, notificationType: DISPUTE_RESOLVED },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: raisedForId,
      }],
    };

    const notificationDataForResolvedStatus = [];
    const notificationDataForDisputeRaisedByUser = {
      title,
      message,
      type: DISPUTE_RESOLVED,
      receiverId: raisedById,
      senderId: userId,
      refId: disputeId,
      refType: DISPUTE,
      refData: dispute,
      actionRequired: false,
    };

    const notificationDataForDisputeRaisedForUser = {
      title,
      message,
      type: DISPUTE_RESOLVED,
      receiverId: raisedForId,
      senderId: userId,
      refId: disputeId,
      refType: DISPUTE,
      refData: dispute,
      actionRequired: false,
    };

    notificationDataForResolvedStatus.push(notificationDataForDisputeRaisedByUser, notificationDataForDisputeRaisedForUser);
    await NotificationModel.bulkCreate(notificationDataForResolvedStatus);
    sendPush(pushDataForDisputeResolvedUser);
    sendPush(pushDataForDisputeResolvedAgainstUser);
  } catch (error) {
    defaultLogger(`Error from creating notification for dispute resolved status : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForDisputeResolvedStatus;
