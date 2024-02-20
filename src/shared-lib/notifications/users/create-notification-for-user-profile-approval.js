const {
  NOTIFICATION_TYPES: { PROFILE_APPROVED }, NOTIFICATION_REF_TYPES: { USER }, FREELANCER, RECRUITER,
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForUserProfileApproval = async (userId, receiverId, role, localeService) => {
  try {
    let message;
    if (role === FREELANCER) {
      message = getMessage('PROFILE_ACTIVATED_MESSAGE_FOR_FREELANCER', localeService);
    }
    if (role === RECRUITER) {
      message = getMessage('PROFILE_ACTIVATED_MESSAGE_FOR_RECRUITER', localeService);
    }
    const title = getMessage('PROFILE_ACTIVATED_TITLE', localeService);

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
      type: PROFILE_APPROVED,
      senderId: userId,
      receiverId,
      refId: receiverId,
      refType: USER,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for user profile approval : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForUserProfileApproval;
