
const { PAID_KEY, DEFAULT_TIMEZONE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  User: UserModel, UserProfile: UserProfileModel, Event: EventModel, City: CityModel,
} = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const {
  ORGANIC_ENQUIRY_SUBMITTED_BY_PAID_RECRUITER,
  ORGANIC_ENQUIRY_SUBMITTED_BY_NON_PAID_RECRUITER,
} = require('../constants/email-template-constants');
const formatEmailDateWithTimeZone = require('../services/format-email-date-with-time-zone');

const sendEmailForOrganicEnquirySubmitted = async (eventId, freelancerId) => {
  try {
    const [freelancer, event] = await Promise.all([
      UserModel.findByPk(freelancerId, {
        attributes: ['fullName', 'contactNo'],
      }),
      EventModel.findByPk(eventId, {
        attributes: ['startDate', 'endDate', 'timeZone'],
        include: [
          {
            model: CityModel,
            as: 'cities',
            attributes: ['name'],
          },
          {
            model: UserModel,
            as: 'recruiter',
            attributes: ['email', 'fullName'],
            include: {
              model: UserProfileModel,
              as: 'profile',
              attributes: ['typeKey'],
            },
          },
        ],
      }),
    ]);

    const { fullName: freelancerName, contactNo: freelancerContactNo } = freelancer;
    const {
      startDate, endDate, cities: { name: eventLocation } = {}, timeZone = DEFAULT_TIMEZONE,
      recruiter: { email, fullName: userName, profile: { typeKey } = {} } = {},
    } = event;

    const templateData = {
      templateKey: typeKey === PAID_KEY ? ORGANIC_ENQUIRY_SUBMITTED_BY_PAID_RECRUITER : ORGANIC_ENQUIRY_SUBMITTED_BY_NON_PAID_RECRUITER,
      toEmailAddress: email,
      data: {
        userName,
        freelancerName,
        freelancerContactNo,
        startDate: formatEmailDateWithTimeZone(startDate, timeZone),
        endDate: formatEmailDateWithTimeZone(endDate, timeZone),
        eventLocation,
      },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForOrganicEnquirySubmitted : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForOrganicEnquirySubmitted;
