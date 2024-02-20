
const { isEmpty } = require('lodash');

const { WEB_URL } = require('../../../config/config');
const { DEFAULT_TIMEZONE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  EventFreelancer: EventFreelancerModel, Event: EventModel, User: UserModel, City: CityModel,
} = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { FREELANCER_GOT_NEW_BOOKING } = require('../constants/email-template-constants');
const formatEmailDateWithTimeZone = require('../services/format-email-date-with-time-zone');

const sendEmailForFreelancerGotNewBooking = async (eventId, userId) => {
  try {
    const assignedFreelancer = await EventFreelancerModel.findOne({
      where: { eventId, userId },
      attributes: ['finalizedPrice'],
      include: [
        {
          model: EventModel,
          as: 'events',
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
              attributes: ['fullName', 'countryCode', 'contactNo'],
            },
            {
              model: UserModel,
              as: 'assignee',
              attributes: ['fullName', 'countryCode', 'contactNo'],
            },
          ],
        },
        {
          model: UserModel,
          as: 'eventFreelancers',
          attributes: ['fullName', 'email', 'contactNo'],
        },
      ],
    });

    const {
      finalizedPrice,
      eventFreelancers: { fullName: freelancerName, email: freelancerEmail, contactNo: freelancerContactNo } = {},
      events: {
        name: eventName, startDate, endDate, timeZone = DEFAULT_TIMEZONE,
        cities: { name: eventLocation } = {},
        recruiter: { fullName: recruiterName, countryCode, contactNo: recruiterContactNo } = {},
        assignee = {},
      },
    } = assignedFreelancer;

    let wedlancerCoordinatorData;
    if (!isEmpty(assignee)) {
      const { fullName: wedlancerCoordinatorName, contactNo: wedlancerCoordinatorContactNo, countryCode: wedlancerCoordinatorCountryCode } = assignee;
      wedlancerCoordinatorData = {
        wedlancerCoordinatorName,
        wedlancerCoordinatorContactNo,
        wedlancerCoordinatorCountryCode,
      };
    }

    const templateData = {
      templateKey: FREELANCER_GOT_NEW_BOOKING,
      toEmailAddress: freelancerEmail,
      data: {
        freelancerName,
        eventName,
        eventUrl: `${WEB_URL}verify/?contact=${freelancerContactNo}&event_id=${eventId}`,
        eventLocation,
        eventStartDate: formatEmailDateWithTimeZone(startDate, timeZone),
        eventEndDate: formatEmailDateWithTimeZone(endDate, timeZone),
        finalizedPrice,
        recruiterName,
        countryCode,
        recruiterContactNo,
        paymentSummaryLink: `${WEB_URL}verify/?contact=${freelancerContactNo}&payment=true`,
        wedlancerCoordinatorData,
      },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForFreelancerGotNewBooking : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForFreelancerGotNewBooking;
