
const { DEFAULT_TIMEZONE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  Event: EventModel, City: CityModel, EventFreelancer: EventFreelancerModel, User: UserModel,
} = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { EVENT_CANCELLED_BY_RECRUITER } = require('../constants/email-template-constants');
const formatEmailDateWithTimeZone = require('../services/format-email-date-with-time-zone');

const sendEmailForEventCancelledByRecruiter = async eventId => {
  try {
    const event = await EventModel.findByPk(eventId, {
      include: [
        {
          model: CityModel,
          as: 'cities',
          attributes: ['name'],
        },
        {
          model: EventFreelancerModel,
          as: 'freelancers',
          include: {
            model: UserModel,
            as: 'eventFreelancers',
            attributes: ['email', 'fullName'],
          },
        },
      ],
    });

    const {
      name: eventName, cities: { name: eventLocation } = {}, startDate, endDate, freelancers, timeZone = DEFAULT_TIMEZONE,
    } = event;

    const eventStartDate = formatEmailDateWithTimeZone(startDate, timeZone);
    const eventEndDate = formatEmailDateWithTimeZone(endDate, timeZone);

    // send email to each freelancer
    freelancers.forEach(freelancer => {
      const { eventFreelancers: { email, fullName } } = freelancer;
      const templateData = {
        templateKey: EVENT_CANCELLED_BY_RECRUITER,
        toEmailAddress: email,
        data: {
          fullName, eventName, eventLocation, eventStartDate, eventEndDate,
        },
      };

      sendEmail(templateData);
    });
  } catch (error) {
    defaultLogger(`Error from sendEmailForEventCancelledByRecruiter : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForEventCancelledByRecruiter;
