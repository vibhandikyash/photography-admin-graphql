/* eslint-disable no-restricted-syntax */
const { isEmpty } = require('lodash');

const { USER_PROFILE_COMPLETION_PERCENTAGE } = require('../../../constants/service-constants');
const isProfileComplete = require('../../../rest/services/is-profile-completed');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const recruiterLogger = require('../recruiter-logger');

const getRecruiterWebProfileDetails = async (_, args, ctx) => {
  try {
    const {
      models: {
        User: UserModel, UserBusiness: UserBusinessModel, UserProfile: UserProfileModel, City: CityModel, State: StateModel, Country: CountryModel,
      }, req: { user: { id: userId, role } }, localeService,
    } = ctx;
    const recruiter = await UserModel.findByPk(userId,
      {
        attributes: ['id', 'fullName', 'email', 'userName', 'contactNo', 'countryCode', 'accountDeletedAt'],
        include: [
          {
            model: UserProfileModel,
            as: 'profile',
            attributes: ['aadharCardFront', 'aadharCardBack'],
          },
          {
            model: UserBusinessModel,
            as: 'business',
            attributes: ['companyName', 'addressLine1', 'addressLine2', 'city', 'state', 'country', 'zipCode'],
            include: [
              {
                model: CityModel,
                as: 'userCity',
                attributes: ['id', 'name'],
              },
              {
                model: StateModel,
                as: 'userState',
                attributes: ['id', 'name'],
              },
              {
                model: CountryModel,
                as: 'userCountry',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      });

    if (!recruiter || recruiter.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('RECRUITER_NOT_FOUND', localeService));
    }

    if (!isEmpty(recruiter.business)) {
      const { business: { userCity = {}, userState = {}, userCountry = {} } = {} } = recruiter;
      recruiter.business.city = userCity;
      recruiter.business.state = userState;
      recruiter.business.country = userCountry;
    }
    const incompleteProfileError = await isProfileComplete(userId, role);
    const { messages } = incompleteProfileError;

    if (incompleteProfileError !== USER_PROFILE_COMPLETION_PERCENTAGE) {
      const incompleteProfileMessage = [];
      for (const messageObj of messages) {
        const title = Object.keys(messageObj)[0];
        const message = messageObj[title];
        incompleteProfileMessage.push(message);
      }
      incompleteProfileError.messages = incompleteProfileMessage;
      recruiter.profileCompletion = incompleteProfileError;
    }

    return recruiter;
  } catch (error) {
    recruiterLogger(`Error from getting recruiter web profile details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterWebProfileDetails;
