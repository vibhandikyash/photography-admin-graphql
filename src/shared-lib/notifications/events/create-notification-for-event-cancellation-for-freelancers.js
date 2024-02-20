/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const moment = require('moment');

const { NOTIFICATION_REF_TYPES: { EVENT }, NOTIFICATION_TYPES: { EVENT_CANCELLED } } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Notification: NotificationModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendBatchPush = require('../send-batch-push');

const createNotificationForEventCancellationForFreelancers = async (event, wedlancerAssuredFreelancers, localeService) => {
  try {
    const { id: eventId, startDate, name: eventName } = event;
    const eventStartDate = moment(startDate).format('DD-MMMM-YYYY');

    const title = getMessage('EVENT_CANCELLED_TITLE', localeService);
    const message = getMessage('EVENT_CANCELLED_MESSAGE', localeService, { eventName, eventDate: eventStartDate });

    const pushData = { title, content: message };

    const notificationDataForEventCancellation = [];
    for (const freelancer of wedlancerAssuredFreelancers) {
      const { userId: freelancerId } = freelancer;
      const notificationData = {
        title,
        message,
        type: EVENT_CANCELLED,
        receiverId: freelancerId,
        refId: eventId,
        refType: EVENT,
        actionRequired: false,
      };
      notificationDataForEventCancellation.push(notificationData);
    }

    await NotificationModel.bulkCreate(notificationDataForEventCancellation);
    sendBatchPush(wedlancerAssuredFreelancers, pushData);
  } catch (error) {
    defaultLogger(`Error from creating notification for event cancellation for freelancers: ${error}`, null, 'error');
  }
};

module.exports = createNotificationForEventCancellationForFreelancers;
