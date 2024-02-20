const { NOTIFICATION_TYPES: { ALL_FREELANCERS_ASSIGNED }, NOTIFICATION_REF_TYPES: { EVENT } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForAllFreelancerAssignmentToRecruiter = async (userId, event, localeService) => {
  try {
    const { id: eventId, recruiterId, leadType } = event;
    const title = getMessage('FREELANCER_ASSIGNMENT_TITLE_FOR_RECRUITER', localeService);
    const message = getMessage('ALL_FREELANCER_ASSIGNMENT_MESSAGE_FOR_RECRUITER', localeService);

    const pushData = {
      title,
      content: message,
      additionalData: { eventId, eventType: leadType, notificationType: ALL_FREELANCERS_ASSIGNED },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: recruiterId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: ALL_FREELANCERS_ASSIGNED,
      refId: eventId,
      senderId: userId,
      receiverId: recruiterId,
      refType: EVENT,
      refData: event,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for all freelancer assignment to recruiter : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForAllFreelancerAssignmentToRecruiter;
