/* eslint-disable no-restricted-syntax */
const { USER_PROFILE_COMPLETION_PERCENTAGE } = require('../../../constants/service-constants');
const isProfileComplete = require('../../../rest/services/is-profile-completed');
const {
  models: {
    User: UserModel, UserProfile: UserProfileModel, UserBadge: UserBadgeModel,
    Badge: BadgeModel,
  },
} = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const getFreelancerWebProfileDetailsService = async (where = {}, role, localeService) => {
  try {
    const freelancer = await UserModel.findOne(
      {
        attributes: ['id', 'fullName', 'email', 'userName', 'contactNo', 'countryCode', 'accountDeletedAt'],
        where,
        include: [{
          model: UserProfileModel,
          as: 'profile',
          attributes: ['bio'],
        },
        {
          model: UserBadgeModel,
          as: 'badge',
          include: {
            model: BadgeModel,
            as: 'userBadge',
            attributes: ['id', 'name'],
          },
        }],
      },
    );

    if (!freelancer || freelancer.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }
    const { badge } = freelancer;
    freelancer.userBadges = [];
    for (const badgeObj of badge) {
      const { userBadge } = badgeObj;
      freelancer.userBadges.push(userBadge);
    }
    const { id: userId } = freelancer;
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
      freelancer.profileCompletion = incompleteProfileError;
    }

    return freelancer;
  } catch (error) {
    freelancerLogger(`Error from getFreelancerWebProfileDetailsService: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebProfileDetailsService;
