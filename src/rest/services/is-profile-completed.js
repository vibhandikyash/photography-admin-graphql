const { intersection } = require('lodash');

const defaultLogger = require('../../logger');

const getProfileStatus = require('./users/get-user-profile-status');

/**
 *  Check is  User's profile completed
 * @param string userId
 * @param FREELANCER|RECRUITER role
 * @returns
 */
const isProfileComplete = async (userId, role) => {
  try {
    if (!['FREELANCER', 'RECRUITER'].includes(role)) return false;

    let result = await getProfileStatus(userId, role);

    const messages = [];

    if (!result.aadharUploaded) {
      messages.push({ UPLOAD_AADHAR_CARD: 'Please upload your aadhaar card.' });
    }

    if (role === 'FREELANCER') {
      if (intersection(result.incompleteFields, ['primaryLocation', 'category', 'bio', 'pricePerDay']).length > 0) {
        messages.push({ UPDATE_PERSONAL_DETAIL: 'Please update your personal information.' });
      }

      if (intersection(result.incompleteFields, ['tagLine', 'accomplishments', 'equipmentList', 'instagramLink']).length > 0) {
        messages.push({ UPDATE_BUSINESS_DETAIL: 'Please update your business details.' });
      }
    } else if (intersection(result.incompleteFields, ['companyName', 'addressLine1', 'addressLine2', 'city',
      'state', 'country', 'zipCode']).length > 0) {
      messages.push({ UPDATE_BUSINESS_DETAIL: 'Please update your business details.' });
    }

    if (result.totalCompletePercentage !== 100) {
      const temp = {};
      let title;
      temp.completedProfile = result.totalCompletePercentage;

      if (result.totalCompletePercentage >= 70) {
        title = 'FEW_INCOMPLETE_PROFILE';
      } else {
        title = 'INCOMPLETE_PROFILE';
      }

      temp.title = title;
      temp.messages = messages;

      result = temp;
    } else {
      result = 100;
    }

    return result;
  } catch (error) {
    defaultLogger(`Error while is-profile-completed: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = isProfileComplete;
