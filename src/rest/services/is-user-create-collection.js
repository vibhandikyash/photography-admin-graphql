const {
  includes,
} = require('lodash');

const { freelancerDefaultCollectionLimit, premiumFreelancerCollectionLimit, premiumFreelancerType } = require('../../constants/constants');

const defaultLogger = require('../../logger');
const {
  models:
   {
     UserProfile: FreelancerProfileModel,
     UserCollection: CollectionModel,
   },
} = require('../../sequelize-client');
const validateUUID = require('../../utils/validate-uuid');

const isUserCreateCollection = async userId => {
  try {
    if (!userId || !validateUUID(userId)) return false;

    const { typeKey } = await FreelancerProfileModel.findOne({ where: { userId }, attributes: ['typeKey'] });

    let count = freelancerDefaultCollectionLimit;
    if (includes(premiumFreelancerType, typeKey)) { // if user is premium type them change the limit
      count = premiumFreelancerCollectionLimit;
    }
    const collectionCount = await CollectionModel.count({ where: { userId } });

    if (collectionCount >= count) {
      return false; // COLLECTION_LIMIT_EXCEEDED
    }
    return true;
  } catch (error) {
    defaultLogger(`Error while isUserCreateCollection: ${error.message}`, null, 'error');
    throw error;
  }
};
module.exports = isUserCreateCollection;
