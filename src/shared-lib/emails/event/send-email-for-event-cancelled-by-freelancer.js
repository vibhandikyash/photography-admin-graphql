const { AWS: { BUCKET: { PRIVATE_BUCKET_NAME } } } = require('../../../config/config');
const { DEFAULT_TIMEZONE, INVOICE_CONTENT_TYPE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Event: EventModel, City: CityModel, User: UserModel } = require('../../../sequelize-client');
const getObject = require('../../aws/functions/get-object');
const sendEmail = require('../../sendgrid');
const { EVENT_CANCELLED_BY_FREELANCER, EVENT_CANCELLED_BY_YOU } = require('../constants/email-template-constants');
const formatEmailDateWithTimeZone = require('../services/format-email-date-with-time-zone');

const sendEmailForEventCancelledByFreelancer = async (eventId, freelancerId, key) => {
  try {
    const [eventInstance, freelancerInstance] = await Promise.all([
      await EventModel.findByPk(eventId, {
        attributes: ['name', 'startDate', 'endDate', 'timeZone'],
        include: [
          {
            model: CityModel,
            as: 'cities',
            attributes: ['name'],
          },
          {
            model: UserModel,
            as: 'recruiter',
            attributes: ['fullName', 'email'],
          },
        ],
      }),
      await UserModel.findByPk(freelancerId, {
        attributes: ['fullName', 'email'],
      }),
    ]);

    const {
      name: eventName, startDate, endDate, timeZone = DEFAULT_TIMEZONE,
      recruiter: { fullName: recruiterName, email: recruiterEmail } = {},
      cities: { name: eventLocation } = {},
    } = eventInstance;

    const { fullName: freelancerName, email: freelancerEmail } = freelancerInstance;
    const eventStartDate = formatEmailDateWithTimeZone(startDate, timeZone);
    const eventEndDate = formatEmailDateWithTimeZone(endDate, timeZone);

    // send event cancel mail to recruiter
    let templateData = {
      templateKey: EVENT_CANCELLED_BY_FREELANCER,
      toEmailAddress: recruiterEmail,
      data: {
        recruiterName, eventName, eventLocation, eventStartDate, eventEndDate, freelancerName,
      },
      attachments: [],
    };

    const { Body: invoiceBufferData = '' } = await getObject(PRIVATE_BUCKET_NAME, key);

    if (invoiceBufferData) {
      templateData.attachments.push({
        content: invoiceBufferData.toString('base64'),
        filename: 'invoice.pdf',
        type: INVOICE_CONTENT_TYPE,
        disposition: 'attachment',
      });
    }
    sendEmail(templateData);

    // send event cancelled mail to freelancer
    templateData = {
      templateKey: EVENT_CANCELLED_BY_YOU,
      toEmailAddress: freelancerEmail,
      data: {
        freelancerName, eventName, eventLocation, eventStartDate, eventEndDate,
      },
    };
    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForEventCancelledByFreelancer : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForEventCancelledByFreelancer;
