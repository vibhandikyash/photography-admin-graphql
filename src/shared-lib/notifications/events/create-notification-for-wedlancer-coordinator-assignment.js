/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { NOTIFICATION_TYPES: { WEDLANCER_COORDINATOR_ASSIGNED }, NOTIFICATION_REF_TYPES: { EVENT } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { User: UserModel, Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendBatchPush = require('../send-batch-push');
const sendPush = require('../send-push');

const createNotificationForWedlancerCoordinatorAssignment = async (userId, event, freelancerIds, coordinatorId, localeService) => {
  try {
    const user = await UserModel.findByPk(coordinatorId, { attributes: ['fullName'] });
    const { fullName: wedlancerCoordinatorName } = user;
    const { id: eventId, recruiterId, leadType } = event;

    const title = getMessage('COORDINATOR_ASSIGNED_TITLE', localeService);
    const message = getMessage('COORDINATOR_ASSIGNED_MESSAGE', localeService, { wedlancerCoordinatorName });

    const pushData = {
      title, content: message, additionalData: { eventId, eventType: leadType, notificationType: WEDLANCER_COORDINATOR_ASSIGNED },
    };
    const notificationData = {
      title,
      message,
      type: WEDLANCER_COORDINATOR_ASSIGNED,
      refId: eventId,
      refType: EVENT,
      refData: event,
      actionRequired: false,
    };

    // NOTIFICATION TO BE SENT TO THE FREELANCERS
    const notificationDataForFreelancers = [];
    for (const freelancerId of freelancerIds) {
      notificationData.senderId = userId;
      notificationData.receiverId = freelancerId.userId;
      notificationDataForFreelancers.push(notificationData);
    }
    const pushDataForFreelancers = {
      ...pushData,
    };

    await NotificationModel.bulkCreate(notificationDataForFreelancers);
    sendBatchPush(freelancerIds, pushDataForFreelancers);

    // NOTIFICATION TO BE SENT TO THE RECRUITER
    notificationData.senderId = userId;
    notificationData.receiverId = recruiterId;

    const pushDataForRecruiter = {
      ...pushData,
      filters: [{
        field: 'tag', key: 'userId', relation: '=', value: recruiterId,
      }],
    };
    await NotificationModel.create(notificationData);
    sendPush(pushDataForRecruiter);
  } catch (error) {
    defaultLogger(`Error from creating notification for wedlancer-coordinator assignment: ${error}`, null, 'error');
  }
};

module.exports = createNotificationForWedlancerCoordinatorAssignment;
