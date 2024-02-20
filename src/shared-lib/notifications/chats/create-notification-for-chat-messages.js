/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { NOTIFICATION_TYPES: { CHAT_MESSAGE_RECEIVED } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { User: UserModel, Event: EventModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForChatMessages = async (chatGroupId, refId, message, notificationReceiverIds, senderId, localeService) => {
  try {
    for (const receiverId of notificationReceiverIds) {
      const sender = await UserModel.findByPk(senderId);
      const event = await EventModel.findByPk(refId);
      const { leadType } = event;
      const { fullName } = sender;
      const title = getMessage('CHAT_MESSAGE_TITLE', localeService, { senderFullName: fullName });
      const pushData = {
        title,
        content: message,
        additionalData: {
          eventId: refId, eventType: leadType, chatGroupId, notificationType: CHAT_MESSAGE_RECEIVED,
        },
        filters: [{
          field: 'tag', key: 'userId', relation: '=', value: receiverId,
        }],
      };
      sendPush(pushData);
    }
  } catch (error) {
    defaultLogger(`Error from creating notification for chat messages: ${error}`, null, 'error');
  }
};

module.exports = createNotificationForChatMessages;
