const {
  NOTIFICATION_TYPES: { ORGANIC_LEAD_ASSIGNED, UPFRONT_LEAD_ASSIGNED }, NOTIFICATION_REF_TYPES: { EVENT }, ORGANIC, UPFRONT,
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { User: UserModel, Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForEventAssignmentToFreelancer = async (userId, event, freelancerId, localeService) => {
  try {
    const { leadType, id: eventId, recruiterId } = event;
    let type;
    if (leadType === ORGANIC) {
      type = ORGANIC_LEAD_ASSIGNED;
    }
    if (leadType === UPFRONT) {
      type = UPFRONT_LEAD_ASSIGNED;
    }
    const recruiter = await UserModel.findByPk(recruiterId, { attributes: ['fullName'] });
    const { fullName: recruiterName } = recruiter;
    const title = getMessage('FREELANCER_ASSIGNMENT_TITLE_FOR_FREELANCER', localeService);
    const message = getMessage('FREELANCER_ASSIGNMENT_MESSAGE_FOR_FREELANCER', localeService, { recruiterName });

    const pushData = {
      title,
      content: message,
      additionalData: { eventId, eventType: leadType, notificationType: type },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: freelancerId,
      }],
    };
    const notificationData = {
      title,
      message,
      type,
      refId: eventId,
      senderId: userId,
      receiverId: freelancerId,
      refType: EVENT,
      refData: event,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for event assignment to the freelancer : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForEventAssignmentToFreelancer;
