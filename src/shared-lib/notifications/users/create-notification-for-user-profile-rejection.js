const {
  NOTIFICATION_TYPES: { PROFILE_REJECTED }, NOTIFICATION_REF_TYPES: { USER },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForUserProfileRejection = async (userId, receiverId, localeService) => {
  try {
    const title = getMessage('PROFILE_REJECTED_TITLE', localeService);
    const message = getMessage('PROFILE_REJECTED_MESSAGE', localeService);

    const pushData = {
      title,
      content: message,
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: receiverId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: PROFILE_REJECTED,
      senderId: userId,
      receiverId,
      refId: receiverId,
      refType: USER,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for user profile rejection : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForUserProfileRejection;
