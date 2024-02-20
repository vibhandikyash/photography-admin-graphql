
const { Op } = require('sequelize');

const { WEB_URL } = require('../../../config/config');

const { DEFAULT_TIMEZONE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  Event: EventModel, User: UserModel, City: CityModel, EventFreelancer: EventFreelancerModel,
} = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { EVENT_COMPLETED_RECRUITER_EMAIL, EVENT_COMPLETED_FREELANCER_EMAIL } = require('../constants/email-template-constants');
const formatEmailDateWithTimeZone = require('../services/format-email-date-with-time-zone');

const sendEmailForEventCompleted = async updatedEventsIds => {
  try {
    const completedEvents = await EventModel.findAll({
      where: { id: { [Op.in]: updatedEventsIds } },
      attributes: ['id', 'name', 'startDate', 'endDate', 'timeZone'],
      include: [
        {
          model: CityModel,
          as: 'cities',
          attributes: ['name'],
        },
        {
          model: UserModel,
          as: 'recruiter',
          attributes: ['fullName', 'email', 'contactNo'],
        },
        {
          model: EventFreelancerModel,
          as: 'freelancers',
          attributes: ['id'],
          include: {
            model: UserModel,
            as: 'eventFreelancers',
            attributes: ['email', 'fullName', 'contactNo'],
          },
          where: { isAssigned: true },
        },
      ],
    });

    completedEvents.forEach(event => {
      try {
        const {
          id: eventId, name: eventName, startDate, endDate, timeZone = DEFAULT_TIMEZONE,
          cities: { name: eventLocation } = {}, freelancers,
          recruiter: { fullName: recruiterName, email: recruiterEmail, contactNo: recruiterContactNo } = {},
        } = event;

        const eventStartDate = formatEmailDateWithTimeZone(startDate, timeZone);
        const eventEndDate = formatEmailDateWithTimeZone(endDate, timeZone);

        // send email to event recruiter
        const recruiterTemplateData = {
          templateKey: EVENT_COMPLETED_RECRUITER_EMAIL,
          toEmailAddress: recruiterEmail,
          data: {
            feedBackLink: `${WEB_URL}verify/?contact=${recruiterContactNo}&event_id=${eventId}`, recruiterName, eventName, eventEndDate, eventStartDate, eventLocation,
          },
        };

        sendEmail(recruiterTemplateData);

        freelancers.forEach(freelancer => {
          try {
            const { eventFreelancers: { email: freelancerEmail, fullName: freelancerName, contactNo: freelancerContactNo } = {} } = freelancer;

            // send email to event freelancers
            const freelancerTemplateData = {
              templateKey: EVENT_COMPLETED_FREELANCER_EMAIL,
              toEmailAddress: freelancerEmail,
              data: {
                feedBackLink: `${WEB_URL}verify/?contact=${freelancerContactNo}&event_id=${eventId}`, freelancerName, eventName, eventEndDate, eventStartDate, recruiterName, eventLocation,
              },
            };

            sendEmail(freelancerTemplateData);
          } catch (error) {
            defaultLogger(`Error while (fetch each event freelancer details)change event status: ${error}`, null, 'error');
          }
        });
      } catch (error) {
        defaultLogger(`Error while (fetch each event details)change event status: ${error}`, null, 'error');
      }
    });
  } catch (error) {
    defaultLogger(`Error from sendEmailForEventCompleted : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForEventCompleted;
