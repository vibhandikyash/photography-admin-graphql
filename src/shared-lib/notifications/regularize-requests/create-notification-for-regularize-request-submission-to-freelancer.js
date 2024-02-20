const {
  NOTIFICATION_REF_TYPES: { REGULARIZE_REQUEST },
  NOTIFICATION_TYPES: { REGULARIZATION_REQUEST_SUBMITTED },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForRegularizeRequestSubmissionToFreelancer = async (userId, requestId, localeService) => {
  try {
    const title = getMessage('REGULARIZATION_REQUEST_SUBMITTED_TITLE', localeService);
    const message = getMessage('REGULARIZATION_REQUEST_SUBMITTED_MESSAGE', localeService);

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
      type: REGULARIZATION_REQUEST_SUBMITTED,
      receiverId: userId,
      refId: requestId,
      refType: REGULARIZE_REQUEST,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for regularize request submission to freelancer : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForRegularizeRequestSubmissionToFreelancer;
