/* eslint-disable no-restricted-syntax */
const { isEmpty, map } = require('lodash');

const {
  models: {
    User: UserModel, UserProfile: UserProfileModel, UserBusiness: UserBusinessModel, Category: CategoryModel,
    UserBadge: UserBadgeModel, Badge: BadgeModel,
  },
} = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const getFreelancerWebDetailsService = async (where = {}, localeService) => {
  try {
    const freelancer = await UserModel.findOne(
      {
        attributes: ['id', 'fullName', 'verificationStatus', 'accountDeletedAt'],
        where,
        include: [{
          model: UserProfileModel,
          as: 'profile',
          attributes: ['coverPhoto', 'profilePhoto', 'averageRating', 'typeKey'],
        },
        {
          model: UserBusinessModel,
          as: 'business',
          attributes: ['categoryId'],
          include: {
            model: CategoryModel,
            as: 'userCategory',
            attributes: ['id', 'name'],
          },
        },
        {
          model: UserBadgeModel,
          as: 'badge',
          attributes: ['badgeId'],
          include: [
            {
              model: BadgeModel,
              as: 'userBadge',
              attributes: ['id', 'name'],
            },
          ],
        },
        ],
      },
    );

    if (!freelancer || freelancer.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }
    if (!isEmpty(freelancer.business)) {
      const { business: { userCategory = {} } = {} } = freelancer;
      freelancer.business.category = userCategory;
    }
    if (!isEmpty(freelancer.badge)) {
      const { badge = {} } = freelancer;
      const badges = map(badge, badgeObj => badgeObj.userBadge);
      freelancer.userBadges = badges;
    }
    return freelancer;
  } catch (error) {
    freelancerLogger(`Error from getFreelancerWebDetailsService: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebDetailsService;
