const { NOTIFICATION_TYPES: { FREELANCER_REMOVED }, NOTIFICATION_REF_TYPES: { EVENT } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { User: UserModel, Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForRemovedFreelancerToRecruiter = async (userId, event, freelancerId, localeService) => {
  try {
    const { id: eventId, recruiterId } = event;
    const freelancer = await UserModel.findByPk(freelancerId, { attributes: ['fullName'] });
    const { fullName: freelancerName } = freelancer;

    const title = getMessage('FREELANCER_REMOVED_TITLE_FOR_RECRUITER', localeService);
    const message = getMessage('FREELANCER_REMOVED_MESSAGE_FOR_RECRUITER', localeService, { freelancerName });

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
      type: FREELANCER_REMOVED,
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
    defaultLogger(`Error from creating notification for removed freelancer to recruiter : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForRemovedFreelancerToRecruiter;
