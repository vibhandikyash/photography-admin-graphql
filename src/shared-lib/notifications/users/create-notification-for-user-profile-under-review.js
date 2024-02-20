const { NOTIFICATION_TYPES: { PROFILE_UNDER_REVIEW }, NOTIFICATION_REF_TYPES: { USER } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForUserProfileUnderReview = async (userId, localeService) => {
  try {
    const title = getMessage('PROFILE_UNDER_REVIEW_TITLE', localeService);
    const message = getMessage('PROFILE_UNDER_REVIEW_MESSAGE', localeService);

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
      type: PROFILE_UNDER_REVIEW,
      receiverId: userId,
      refId: userId,
      refType: USER,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for user profile under review : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForUserProfileUnderReview;
