
const { PAID_KEY, DEFAULT_TIMEZONE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  Event: EventModel, City: CityModel, User: UserModel, UpfrontCategoryRequirement: UpfrontCategoryRequirementModel,
  Category: CategoryModel, UserProfile: UserProfileModel,
} = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const {
  UPFRONT_ENQUIRY_SUBMITTED_FOR_PAID_RECRUITER,
  UPFRONT_ENQUIRY_SUBMITTED_FOR_NON_PAID_RECRUITER,
} = require('../constants/email-template-constants');
const formatEmailDateWithTimeZone = require('../services/format-email-date-with-time-zone');

const sendEmailForUpFrontEnquirySubmitted = async eventId => {
  try {
    const event = await EventModel.findByPk(eventId, {
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
          attributes: ['fullName', 'email'],
          include: { model: UserProfileModel, as: 'profile', attributes: ['typeKey'] },
        },
        {
          model: UpfrontCategoryRequirementModel,
          as: 'categories',
          attributes: ['count'],
          include: {
            model: CategoryModel,
            as: 'eventCategory',
            attributes: ['name'],
          },
        },
      ],
    });

    // destructure event data
    const {
      startDate, endDate, cities: { name: eventLocation } = {}, timeZone = DEFAULT_TIMEZONE,
      recruiter: { fullName: recruiterName, email: recruiterEmail, profile: { typeKey } = {} } = {},
      categories,
    } = event;

    //  Make requirements string in format (EX: 2 photographer, 1 traditional photographer and 1 cinematographer)
    let requirements = '';
    // eslint-disable-next-line no-plusplus
    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const { count, eventCategory: { name } } = categories[categoryIndex];
      if (categoryIndex !== 0) {
        requirements += categoryIndex < categories.length - 1 ? ', ' : ' and ';
      }
      requirements += `${count} ${name}`;
    }

    const templateData = {
      templateKey: typeKey === PAID_KEY ? UPFRONT_ENQUIRY_SUBMITTED_FOR_PAID_RECRUITER : UPFRONT_ENQUIRY_SUBMITTED_FOR_NON_PAID_RECRUITER,
      toEmailAddress: recruiterEmail,
      data: {
        recruiterName,
        requirements: requirements.toLowerCase(),
        eventLocation,
        eventStartDate: formatEmailDateWithTimeZone(startDate, timeZone),
        eventEndDate: formatEmailDateWithTimeZone(endDate, timeZone),
      },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForUpFrontEnquirySubmitted : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForUpFrontEnquirySubmitted;
