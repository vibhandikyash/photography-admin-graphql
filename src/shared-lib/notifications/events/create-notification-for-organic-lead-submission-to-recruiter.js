const { NOTIFICATION_TYPES: { ORGANIC_LEAD_SUBMITTED }, NOTIFICATION_REF_TYPES: { EVENT } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForOrganicLeadSubmissionToRecruiter = async (recruiterId, eventId, localeService) => {
  try {
    const title = getMessage('ENQUIRY_SUBMITTED_TITLE', localeService);
    const message = getMessage('ENQUIRY_SUBMITTED_MESSAGE', localeService);

    const pushData = {
      title,
      content: message,
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: recruiterId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: ORGANIC_LEAD_SUBMITTED,
      receiverId: recruiterId,
      refId: eventId,
      refType: EVENT,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for organic lead submission to recruiter: ${error}`, null, 'error');
  }
};

module.exports = createNotificationForOrganicLeadSubmissionToRecruiter;
