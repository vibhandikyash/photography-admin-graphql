/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { Op } = require('sequelize');

const {
  NOTIFICATION_TYPES: { FREELANCER_REVIEW_REMINDER, RECRUITER_REVIEW_REMINDER },
  NOTIFICATION_REF_TYPES: { EVENT },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  Notification: NotificationModel, Event: EventModel, EventFreelancer: EventFreelancerModel,
} = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForRatingsReminderToUser = async updatedEventIds => {
  try {
    const completedEvents = await EventModel.findAll({
      where: { id: { [Op.in]: updatedEventIds } },
      attributes: ['id', 'leadType', 'recruiterId'],
      include: [
        {
          model: EventFreelancerModel,
          as: 'freelancers',
          attributes: ['userId'],
          where: { isAssigned: true },
        },
      ],
    });

    const titleForRecruiter = getMessage('RECRUITER_RATINGS_REMINDER_TITLE');
    const messageForRecruiter = getMessage('RECRUITER_RATINGS_REMINDER_MESSAGE');
    const titleForFreelancer = getMessage('FREELANCER_RATINGS_REMINDER_TITLE');
    const messageForFreelancer = getMessage('FREELANCER_RATINGS_REMINDER_MESSAGE');

    for (const event of completedEvents) {
      const {
        id: eventId, leadType, recruiterId, freelancers,
      } = event;
      const notificationDataForFreelancer = [];
      for (const freelancer of freelancers) {
        const { userId: freelancerId } = freelancer;
        // SEND NOTIFICATION TO FREELANCER
        const pushData = {
          title: titleForFreelancer,
          content: messageForFreelancer,
          additionalData: { eventId, eventType: leadType, notificationType: RECRUITER_REVIEW_REMINDER },
          filters: [{
            field: 'tag', key: 'userId', relation: '=', value: freelancerId,
          }],
        };
        const notificationsForFreelancer = {
          title: titleForFreelancer,
          message: messageForFreelancer,
          type: RECRUITER_REVIEW_REMINDER,
          receiverId: freelancerId,
          refId: eventId,
          refType: EVENT,
          refData: event,
          actionRequired: false,
        };
        sendPush(pushData);
        notificationDataForFreelancer.push(notificationsForFreelancer);
      }

      // SEND NOTIFICATION TO RECRUITER
      const pushDataForRecruiter = {
        title: titleForRecruiter,
        content: messageForRecruiter,
        additionalData: { eventId, eventType: leadType, notificationType: FREELANCER_REVIEW_REMINDER },
        filters: [{
          field: 'tag', key: 'userId', relation: '=', value: recruiterId,
        }],
      };
      const notificationDataForRecruiter = {
        title: titleForRecruiter,
        message: messageForRecruiter,
        type: FREELANCER_REVIEW_REMINDER,
        receiverId: recruiterId,
        refId: eventId,
        refType: EVENT,
        refData: event,
        actionRequired: false,
      };
      sendPush(pushDataForRecruiter);
      await NotificationModel.create(notificationDataForRecruiter);
      await NotificationModel.bulkCreate(notificationDataForFreelancer);
    }
  } catch (error) {
    defaultLogger(`Error from creating notification for ratings reminder to recruiter and freelancer: ${error}`, null, 'error');
  }
};

module.exports = createNotificationForRatingsReminderToUser;
