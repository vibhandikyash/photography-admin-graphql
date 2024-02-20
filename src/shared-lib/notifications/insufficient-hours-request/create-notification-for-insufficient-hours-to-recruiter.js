const { NOTIFICATION_TYPES: { INSUFFICIENT_WORKING_HOURS }, NOTIFICATION_REF_TYPES: { EVENT } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel, User: UserModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForInsufficientHoursToRecruiter = async (freelancerId, event) => {
  try {
    const { id: eventId, leadType, recruiterId } = event;
    const user = await UserModel.findByPk(freelancerId);
    const { fullName: freelancerName } = user;
    const title = getMessage('INSUFFICIENT_HOURS_REQUEST_TITLE_FOR_RECRUITER');
    const message = `We have found insufficiency in working hours of ${freelancerName} Please Check!!`;

    const pushData = {
      title,
      content: message,
      additionalData: { eventId, eventType: leadType, notificationType: INSUFFICIENT_WORKING_HOURS },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: recruiterId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: INSUFFICIENT_WORKING_HOURS,
      receiverId: recruiterId,
      refId: eventId,
      refType: EVENT,
      refData: event,
      actionRequired: false,
    };

    await NotificationModel.create(notificationData);
    sendPush(pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for insufficient hours request to recruiter: ${error}`, null, 'error');
  }
};

module.exports = createNotificationForInsufficientHoursToRecruiter;
