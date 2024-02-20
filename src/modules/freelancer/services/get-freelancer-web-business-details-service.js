/* eslint-disable no-restricted-syntax */
const { isEmpty } = require('lodash');

const {
  models: {
    User: UserModel, UserBusiness: UserBusinessModel, UserProfile: UserProfileModel, Category: CategoryModel, City: CityModel,
  },
} = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const getFreelancerWebBusinessDetailsService = async (where = {}, localeService) => {
  try {
    const freelancer = await UserModel.findOne(
      {
        attributes: ['id', 'accountDeletedAt'],
        where,
        include: [{
          model: UserProfileModel,
          as: 'profile',
          attributes: ['aadharCardFront', 'aadharCardBack'],
        },
        {
          model: UserBusinessModel,
          as: 'business',
          attributes: ['tagLine', 'accomplishments', 'equipmentList', 'primaryLocation', 'secondaryLocation', 'instagramLink', 'pricePerDay'],
          include: [
            {
              model: CategoryModel,
              as: 'userCategory',
              attributes: ['id', 'name'],
            },
            {
              model: CityModel,
              as: 'userPrimaryLocation',
              attributes: ['id', 'name'],
            },
            {
              model: CityModel,
              as: 'userSecondaryLocation',
              attributes: ['id', 'name'],
            },
          ],
        }],
      },
    );

    if (!freelancer || freelancer.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }
    if (!isEmpty(freelancer.business)) {
      const { business: { userCategory = {}, userPrimaryLocation = {}, userSecondaryLocation = {} } = {} } = freelancer;
      freelancer.business.category = userCategory;
      freelancer.business.primaryLocation = userPrimaryLocation;
      freelancer.business.secondaryLocation = userSecondaryLocation;
    }
    return freelancer;
  } catch (error) {
    freelancerLogger(`Error from getFreelancerWebBusinessDetailsService: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebBusinessDetailsService;
