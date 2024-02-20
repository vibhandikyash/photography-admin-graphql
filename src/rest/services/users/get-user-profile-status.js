/* eslint-disable security/detect-object-injection */
const defaultLogger = require('../../../logger');
const {
  models:
   {
     UserProfile: UserProfileModel, User: UserModel,
     UserType: UserTypeModel, UserBusiness: UserBusinessModel,
     Category: CategoryModel,
   },
} = require('../../../sequelize-client');

/**
 * Custom function to check the variable is defined or not.
 * @param {string} data
 * @returns {boolean}
 */
const customIsEmpty = data => data === undefined || data === null;
/**
 * Get the user profile completion status
 * validation done before calling the function
 * @param {UUID} userId
 * @param {string} role
 * @returns {array}
 */
const getProfileStatus = async (userId, role) => {
  try {
    const user = await UserModel.findByPk(userId, {
      include: [{
        model: UserProfileModel,
        as: 'profile',
        attributes: ['bio', 'profilePhoto', 'isFeatured', 'coverPhoto', 'aadharCardFront', 'aadharCardBack'],
        include: [{
          model: UserTypeModel,
          as: 'userType',
          attributes: ['key', 'value'],
        }],
      }, {
        model: UserBusinessModel,
        as: 'business',
        attributes: ['projectsComplete', 'companyName', 'tagLine', 'pricePerDay', 'primaryLocation',
          'accomplishments', 'equipmentList', 'instagramLink', 'addressLine1', 'addressLine2', 'city', 'state', 'country', 'zipCode'],
        include: [{
          model: CategoryModel,
          as: 'userCategory',
          attributes: ['name'],
        }],
      },
      ],
      plain: true,
      attributes: ['id', 'fullName', 'userName', 'email', 'emailVerified', 'verificationStatus', 'contactNo',
        'countryCode', 'role', 'isActive'],
    });
    let aadharUploaded;
    if (user.profile) {
      const { profile: { aadharCardFront = null, aadharCardBack = null } = {} } = user;
      aadharUploaded = aadharCardFront && aadharCardBack; // Check if aadharCard is uploaded or not
    }

    const roleFieldMap = {
      FREELANCER: ['primaryLocation', 'pricePerDay', 'tagLine', 'instagramLink', 'equipmentList', 'accomplishments'],
      RECRUITER: ['companyName', 'addressLine1', 'addressLine2', 'country', 'state', 'city', 'zipCode'],
    };
    const fields = roleFieldMap[role] || [];

    const incompleteFields = [];

    fields.forEach(field => {
      if (customIsEmpty(user.business[field])) {
        incompleteFields.push(field);
      }
    });

    if (role === 'FREELANCER') {
      fields.push('category', 'bio');
      if (customIsEmpty(user.profile?.bio)) incompleteFields.push('bio');
      if (customIsEmpty(user.business?.userCategory)) incompleteFields.push('category');
    }

    let totalIncompletePercent;
    let totalCompletePercentage;

    fields.push('aadhaar');
    if (!aadharUploaded) {
      incompleteFields.push('aadhaar');
    }

    if (incompleteFields.length !== 0) {
      // Percentage allocation based on the user role
      const fieldsPercentMap = {
        FREELANCER: {
          primaryLocation: 10,
          pricePerDay: 10,
          tagLine: 10,
          instagramLink: 10,
          equipmentList: 10,
          accomplishments: 10,
          category: 10,
          bio: 10,
          aadhaar: 20,
        },
        RECRUITER: {
          companyName: 15,
          addressLine1: 15,
          addressLine2: 10,
          country: 10,
          state: 10,
          city: 10,
          zipCode: 10,
          aadhaar: 20,
        },
      };

      const fieldsPercent = fieldsPercentMap[role] || {};

      const incompletePercentArr = [];
      incompleteFields.forEach(field => {
        incompletePercentArr.push(fieldsPercent[`${field}`]);
      });

      totalIncompletePercent = incompletePercentArr.reduce((a, b) => a + b);

      totalCompletePercentage = 100 - totalIncompletePercent;

      if (totalCompletePercentage < 0) {
        totalCompletePercentage = 0;
      }
    } else {
      totalCompletePercentage = 100;
    }

    const result = {
      aadharUploaded,
      incompleteFieldCount: incompleteFields.length,
      totalIncompletePercent,
      totalCompletePercentage,
      incompleteFields,
    };

    return result;
  } catch (e) {
    defaultLogger(`Error in get-user-profile-status: ${e.message}`);
    throw e;
  }
};

module.exports = getProfileStatus;
