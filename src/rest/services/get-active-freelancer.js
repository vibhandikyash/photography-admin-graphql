const _ = require('lodash');

const defaultLogger = require('../../logger');

const {
  models: {
    Category: CategoryModel,
    User: UserModel,
    City: CityModel,
    UserProfile: UserProfileModel,
    UserBusiness: UserBusinessModel,
    UserBadge: UserBadgeModel,
    Badge: BadgeModel,
  },
} = require('../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../shared-lib/aws/functions/generate-url-for-keys');

/**
 * Get the updated user object with the relative values
 * @param {string} userId
 * @returns UserModel
 */
const getActiveFreelancer = async userId => {
  try {
    if (!userId) return false; // If no userId provided, return false

    let response = await UserModel.findOne({
      where: {
        id: userId, isActive: true, verificationStatus: 'APPROVED', role: 'FREELANCER', accountDeletedAt: null,
      },
      include: [{
        model: UserProfileModel,
        as: 'profile',
        attributes: ['bio', 'profilePhoto', 'coverPhoto', 'isFeatured', 'typeKey', 'averageRating'],
      },
      {
        model: UserBusinessModel,
        as: 'business',
        attributes: ['projectsComplete', 'tagLine', 'pricePerDay',
          'accomplishments', 'equipmentList', 'instagramLink'],
        include: [
          {
            model: CategoryModel,
            as: 'userCategory',
            attributes: ['name'],
          },
          {
            model: CityModel,
            as: 'userPrimaryLocation',
            attributes: ['id', 'name', 'stateCode', 'countryCode'],
          },
          {
            model: CityModel,
            as: 'userSecondaryLocation',
            attributes: ['id', 'name', 'stateCode', 'countryCode'],
          },
        ],
      },
      {
        model: UserBadgeModel,
        as: 'badge',
        attributes: ['id'],
        include: [
          {
            model: BadgeModel,
            as: 'userBadge',
            attributes: ['name'],
          },
        ],
      },
      ],
      returning: true,
      plain: true,
      attributes: ['id', 'fullName', 'userName', 'email', 'emailVerified', 'verificationStatus', 'contactNo',
        'countryCode', 'role', 'isActive'],
    });

    if (!response) {
      return false;
    }

    response = JSON.parse(JSON.stringify(response));
    // Add secondary location for users except 'FREE' type user profile
    if (response.profile && response.business && response.profile.typeKey !== 'FREE') {
      response.business.userSecondaryLocation = response.business.userSecondaryLocation ?? {};
    }

    response.profile.profilePhoto = response?.profile.profilePhoto ? _.values(await getKeysAndGenerateUrl([response.profile.profilePhoto]))[0] : null;
    response.profile.coverPhoto = response?.profile.coverPhoto ? _.values(await getKeysAndGenerateUrl([response.profile.coverPhoto]))[0] : null;
    if (response.business.userCategory) { // Check user have the category
      response.category = response.business.userCategory.name;
      delete response.business.userCategory;
    }

    return response;
  } catch (error) {
    defaultLogger(`Error while getActiveFreelancer: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getActiveFreelancer;
