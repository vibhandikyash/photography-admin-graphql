const {
  SUPER_ADMIN,
  NOTIFICATION_TYPES: { REGULARIZATION_REQUEST_SUBMITTED, INSUFFICIENT_WORKING_HOURS },
  NOTIFICATION_REF_TYPES: { REGULARIZE_REQUEST },
  REGULARIZE_REQUEST_TYPES: { INSUFFICIENT_HOURS },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  Notification: NotificationModel, Event: EventModel, User: UserModel,
  RegularizeRequest: RegularizeRequestModel, EventTiming: EventTimingModel,
} = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const formatNotificationDateWithTimeZone = require('../services/format-notification-date-with-time-zone');

const createNotificationForRegularizeRequestToAdmin = async (requestId, localeService) => {
  try {
    const regularizeRequest = await RegularizeRequestModel.findByPk(requestId, {
      attributes: ['requestType'],
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'fullName'],
        },
        {
          model: EventTimingModel,
          as: 'eventTiming',
          attributes: ['startDate'],
        },
        {
          model: EventModel,
          as: 'event',
          attributes: ['id', 'leadType'],
          include: {
            model: UserModel,
            as: 'assignee',
            attributes: ['id'],
          },
        },
      ],
    });

    const { id: superAdminId } = await UserModel.findOne({
      where: { role: SUPER_ADMIN },
      attributes: ['id'],
    });

    const {
      requestType,
      user: { id: freelancerId, fullName: freelancerName } = {},
      eventTiming: { startDate },
      event: { id: eventId, assignee: wedlancerCoordinator, leadType: eventType } = {},
    } = regularizeRequest;

    const eventTiming = formatNotificationDateWithTimeZone(startDate);

    let title; let message; let type;

    if (requestType === INSUFFICIENT_HOURS) {
      title = getMessage('INSUFFICIENT_HOURS_ADMIN_NOTIFICATION_TITLE');
      message = `Insufficient working hours found for ${freelancerName} for ${eventTiming}.`;
      type = INSUFFICIENT_WORKING_HOURS;
    } else {
      title = getMessage('REGULARIZE_REQUEST_ADMIN_NOTIFICATION_TITLE', localeService, { freelancerName });
      message = getMessage('REGULARIZE_REQUEST_ADMIN_NOTIFICATION_MESSAGE', localeService, { freelancerName, eventTiming });
      type = REGULARIZATION_REQUEST_SUBMITTED;
    }

    const notificationData = {
      title,
      message,
      type,
      senderId: freelancerId,
      receiverId: superAdminId,
      refId: requestId,
      refType: REGULARIZE_REQUEST,
      refData: { eventId, eventType },
    };

    // notification for super admin
    await NotificationModel.create(notificationData);

    // notification for wedlancer coordinator
    if (wedlancerCoordinator && wedlancerCoordinator.id) {
      notificationData.receiverId = wedlancerCoordinator.id;
      await NotificationModel.create(notificationData);
    }
  } catch (error) {
    defaultLogger(`Error from creating notification for regularize request to admin : ${error}`, 'error');
  }
};

module.exports = createNotificationForRegularizeRequestToAdmin;
