/* eslint-disable no-restricted-syntax */
const { Op } = require('sequelize');

const { NOTIFICATION_TYPES: { CLOCK_IN_REMINDER }, NOTIFICATION_REF_TYPES: { EVENT } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  Notification: NotificationModel, FreelancerAttendance: FreelancerAttendanceModel,
  EventTiming: EventTimingModel, Event: EventModel,
} = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForEventOtpReminderToFreelancer = async (currentTime, nextHourOfCurrentTime) => {
  try {
    const freelancerAttendanceData = await FreelancerAttendanceModel.findAll({
      include: [
        {
          model: EventTimingModel,
          as: 'eventTimings',
          where: { startDate: { [Op.gt]: currentTime, [Op.lte]: nextHourOfCurrentTime } },
        },
        {
          model: EventModel,
          as: 'event',
        },
      ],
    });

    const notificationDataForFreelancer = [];
    for (const freelancer of freelancerAttendanceData) {
      const { userId: freelancerId, event } = freelancer;
      const { id: eventId, leadType } = event;
      const title = getMessage('EVENT_OTP_REMINDER_TITLE');
      const message = getMessage('EVENT_OTP_REMINDER_MESSAGE');

      const pushData = {
        title,
        content: message,
        additionalData: { eventId, eventType: leadType, notificationType: CLOCK_IN_REMINDER },
        filters: [{
          field: 'tag', key: 'userId', relation: '=', value: freelancerId,
        }],
      };
      const notificationData = {
        title,
        message,
        type: CLOCK_IN_REMINDER,
        receiverId: freelancerId,
        refId: eventId,
        refType: EVENT,
        refData: event,
        actionRequired: false,
      };
      notificationDataForFreelancer.push(notificationData);
      sendPush(pushData);
    }
    await NotificationModel.bulkCreate(notificationDataForFreelancer);
  } catch (error) {
    defaultLogger(`Error from creating notification for event otp reminder to freelancer: ${error}`, null, 'error');
  }
};

module.exports = createNotificationForEventOtpReminderToFreelancer;
