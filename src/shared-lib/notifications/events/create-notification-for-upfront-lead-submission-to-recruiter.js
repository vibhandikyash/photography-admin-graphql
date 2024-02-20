const {
  NOTIFICATION_TYPES: { UPFRONT_LEAD_SUBMITTED }, NOTIFICATION_REF_TYPES: { EVENT }, PAID_KEY,
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForUpfrontLeadSubmissionToRecruiter = async (userId, eventId, recruiterType, localeService) => {
  try {
    let message;
    const title = getMessage('ENQUIRY_SUBMITTED_TITLE', localeService);
    if (recruiterType === PAID_KEY) {
      message = getMessage('UPFRONT_ENQUIRY_SUBMITTED_MESSAGE_FOR_PAID_RECRUITER', localeService);
    } else {
      message = getMessage('UPFRONT_ENQUIRY_SUBMITTED_MESSAGE_FOR_NON_PAID_RECRUITER', localeService);
    }

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
      type: UPFRONT_LEAD_SUBMITTED,
      receiverId: userId,
      refId: eventId,
      refType: EVENT,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for upfront lead submission to recruiter : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForUpfrontLeadSubmissionToRecruiter;
