const { omit, values } = require('lodash');

const defaultLogger = require('../logger');
const { ApiError } = require('../rest/services/custom-api-error');
const { NOT_FOUND } = require('../rest/services/http-status-codes');
const isProfileComplete = require('../rest/services/is-profile-completed');
const {
  models: {
    Category: CategoryModel,
    UserBadge: UserBadgeModel,
    Badge: BadgeModel,
    User: UserModel,
    City: CityModel,
    UserProfile: UserProfileModel,
    UserBusiness: UserBusinessModel,
    State: StateModel,
    Country: CountryModel,
  },
} = require('../sequelize-client');
const { getKeysAndGenerateUrl } = require('../shared-lib/aws/functions/generate-url-for-keys');

const { getMessage } = require('./messages');

/**
 * Get the updated user object with the relative values
 * @param {string} userId
 * @returns UserModel
 */
const getUserWithRelationship = async user => {
  try {
    if (!user) return false; // If no user provided, return false
    const userId = user.id;

    const businessIncludes = [
      {
        model: CategoryModel,
        as: 'userCategory',
        attributes: ['name'],
      },
    ];

    // Add the business  city, state & country to the user if user is recruiter
    if (user.role === 'RECRUITER') {
      businessIncludes.push(
        {
          model: CityModel,
          as: 'userCity',
          attributes: ['id', 'name'],
        },
        {
          model: StateModel,
          as: 'userState',
          attributes: ['id', 'name', 'countryCode'],
        },
        {
          model: CountryModel,
          as: 'userCountry',
          attributes: ['id', 'name'],
        },
      );
    }

    if (user.role === 'FREELANCER') {
      businessIncludes.push({
        model: CityModel,
        as: 'userPrimaryLocation',
        attributes: ['id', 'name', 'stateCode', 'countryCode'],
      });

      if (user.profile.typeKey !== 'FREE') {
        businessIncludes.push({
          model: CityModel,
          as: 'userSecondaryLocation',
          attributes: ['id', 'name', 'stateCode', 'countryCode'],
        });
      }
    }

    const options = {
      include: [{
        model: UserProfileModel,
        as: 'profile',
        attributes: ['bio', 'isFeatured', 'profilePhoto', 'coverPhoto', 'typeKey', 'averageRating'],
      }, {
        model: UserBusinessModel,
        as: 'business',
        attributes: ['projectsComplete', 'companyName', 'tagLine', 'pricePerDay',
          'accomplishments', 'equipmentList', 'instagramLink', 'addressLine1', 'addressLine2', 'zipCode'],
        include: businessIncludes,
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
        'countryCode', 'role', 'isActive', 'accountDeletedAt'],
    };
    let response = await UserModel.findByPk(userId, options);

    if (!response || response.accountDeletedAt !== null) {
      throw new ApiError(getMessage('USER_NOT_FOUND'), NOT_FOUND);
    }
    response = JSON.parse(JSON.stringify(response));

    if (response.profile) {
      response.profile.profilePhoto = response.profile?.profilePhoto ? values(await getKeysAndGenerateUrl([response.profile.profilePhoto]))[0] : null;
      response.profile.coverPhoto = response.profile?.coverPhoto ? values(await getKeysAndGenerateUrl([response.profile.coverPhoto]))[0] : null;
    }

    // Remove unnecessary data from the response object based on the user's role
    let unsetArr;
    response.category = '';
    if (response.business) { // Handle the error when business details not created by the user
      if (response.role === 'FREELANCER') {
        if (response.business.userCategory) { // Check user have the category
          response.category = response.business.userCategory.name;
        }
        unsetArr = [
          'business.addressLine1', 'business.city',
          'business.addressLine2',
          'business.state', 'business.country',
          'business.zipCode', 'business.userCategory',
          'business.companyName',
        ];
      } else { // for Recruiter
        unsetArr = [
          'profile.averageRating', 'profile.isFeatured',
          'business.projectsComplete', 'business.tagLine',
          'business.pricePerDay', 'business.primaryLocation',
          'business.secondaryLocation', 'business.accomplishments',
          'business.equipmentList', 'business.instagramLink',
          'profile.bio', 'business.userPrimaryLocation', 'business.userCategory',
        ];
      }
    }

    if (user.role !== 'FREELANCER') {
      response = omit(response, ['badge', 'category']);
    }

    response = omit(response, unsetArr);

    // Check user's profile is 100% completed or not, if not then add errors to response object
    const profileError = await isProfileComplete(response.id, response.role);
    if (profileError !== 100) {
      response.errors = profileError;
    }

    return response;
  } catch (error) {
    defaultLogger(`Error while get-user-with-relationship: ${error}`, null, 'error');
    return false;
  }
};

module.exports = getUserWithRelationship;
