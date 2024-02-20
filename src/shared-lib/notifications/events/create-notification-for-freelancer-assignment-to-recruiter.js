const { get } = require('lodash');

const { NOTIFICATION_TYPES: { FREELANCER_ASSIGNED }, NOTIFICATION_REF_TYPES: { EVENT } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  UserBusiness: UserBusinessModel, Category: CategoryModel,
} = require('../../../sequelize-client');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForFreelancerAssignmentToRecruiter = async (userId, event, freelancerId, localeService) => {
  try {
    const {
      id: eventId, recruiterId, name: eventName, leadType,
    } = event;

    const businessData = await UserBusinessModel.findOne({
      where: { userId: freelancerId },
      attributes: ['userId'],
      include: { model: CategoryModel, as: 'userCategory', attributes: ['name'] },
    });
    const categoryName = get(businessData, 'userCategory.name');

    const title = getMessage('FREELANCER_ASSIGNMENT_TITLE_FOR_RECRUITER', localeService);
    const message = getMessage('FREELANCER_ASSIGNMENT_MESSAGE_FOR_RECRUITER', localeService, { freelancerCategory: categoryName, eventName });

    const pushData = {
      title,
      content: message,
      additionalData: { eventId, eventType: leadType, notificationType: FREELANCER_ASSIGNED },
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: recruiterId,
      }],
    };
    const notificationData = {
      title,
      message,
      type: FREELANCER_ASSIGNED,
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
    defaultLogger(`Error from creating notification for freelancer assignment to recruiter : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForFreelancerAssignmentToRecruiter;
