const {
  SUPER_ADMIN,
  NOTIFICATION_TYPES: { DISPUTE_RAISED },
  NOTIFICATION_REF_TYPES: { DISPUTE },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  Notification: NotificationModel, Event: EventModel, User: UserModel, Dispute: DisputeModel,
} = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');

const createNotificationForDisputeRaisedToAdmin = async (disputeId, localeService) => {
  try {
    // fetch dispute details
    const dispute = await DisputeModel.findByPk(disputeId, {
      attributes: [],
      include: [
        {
          model: EventModel,
          as: 'event',
          attributes: ['name'],
          include: {
            model: UserModel,
            as: 'assignee',
            attributes: ['id'],
          },
        },
        {
          model: UserModel,
          as: 'creator',
          attributes: ['id', 'fullName', 'role'],
        },
      ],
    });

    const {
      event: { name: eventName, assignee: wedlancerCoordinator } = {},
      creator: { id: senderId, fullName: senderName, role: senderRole } = {},
    } = dispute;

    const { id: superAdminId } = await UserModel.findOne({
      where: { role: SUPER_ADMIN },
      attributes: ['id'],
    });

    const title = getMessage('DISPUTE_RAISED_ADMIN_NOTIFICATION_TITLE', localeService, { senderRole: senderRole.toLowerCase() });
    const message = getMessage('DISPUTE_RAISED_ADMIN_NOTIFICATION_MESSAGE', localeService, { senderName, eventName });

    const notificationData = {
      title,
      message,
      type: DISPUTE_RAISED,
      senderId,
      receiverId: superAdminId,
      refId: disputeId,
      refType: DISPUTE,
      refData: { disputeId },
    };

    // notification for super admin
    await NotificationModel.create(notificationData);

    // notification for wedlancer coordinator
    if (wedlancerCoordinator && wedlancerCoordinator.id) {
      notificationData.receiverId = wedlancerCoordinator.id;
      await NotificationModel.create(notificationData);
    }
  } catch (error) {
    defaultLogger(`Error from creating notification for dispute raised to admin : ${error}`, 'error');
  }
};

module.exports = createNotificationForDisputeRaisedToAdmin;
