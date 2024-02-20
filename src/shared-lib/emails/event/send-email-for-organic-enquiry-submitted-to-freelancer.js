
const { DEFAULT_TIMEZONE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  User: UserModel, UserProfile: UserProfileModel, Event: EventModel, City: CityModel, UserBusiness: UserBusinessModel,
} = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { ORGANIC_ENQUIRY_TO_FREELANCER } = require('../constants/email-template-constants');
const formatEmailDateWithTimeZone = require('../services/format-email-date-with-time-zone');

const sendEmailForOrganicEnquirySubmittedToFreelancer = async (eventId, freelancerId) => {
  try {
    const [freelancer, event] = await Promise.all([
      UserModel.findByPk(freelancerId, {
        attributes: ['fullName', 'contactNo', 'userName', 'email'],
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
            attributes: ['contactNo'],
            include: [
              {
                model: UserProfileModel,
                as: 'profile',
                attributes: ['typeKey'],
              },
              {
                model: UserBusinessModel,
                as: 'business',
                attributes: ['companyName', 'addressLine1'],
              },
            ],
          },
        ],
      }),
    ]);

    const { userName, email: freelancerEmail } = freelancer;
    const {
      startDate, cities: { name: eventLocation } = {}, timeZone = DEFAULT_TIMEZONE,
      recruiter: { contactNo, business: { companyName, addressLine1 } = {} } = {},
    } = event;

    const templateData = {
      templateKey: ORGANIC_ENQUIRY_TO_FREELANCER,
      toEmailAddress: freelancerEmail,
      data: {
        userName,
        companyName,
        contactNo,
        address: addressLine1,
        startDate: formatEmailDateWithTimeZone(startDate, timeZone),
        eventLocation,
      },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForOrganicEnquirySubmittedToFreelancer : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForOrganicEnquirySubmittedToFreelancer;
