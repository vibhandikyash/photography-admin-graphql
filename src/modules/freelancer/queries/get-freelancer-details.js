const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');

const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const getFreelancerDetails = async (_, args, ctx) => {
  try {
    const {
      models: {
        User: UserModel,
        Category: CategoryModel,
        UserBusiness: FreelancerBusinessModel,
        UserProfile: FreelancerProfileModel,
        UserBadge: FreelancerBadgeModel,
        City: CitiesModel,
        State: StateModel,
        Country: CountriesModel,
      },
      localeService,
    } = ctx;

    let freelancer = await UserModel.findOne(
      {
        where: { id: args.id, role: 'FREELANCER' },
        attributes: { exclude: ['password', 'refresh_token', 'otp', 'otpExpiry', 'otpRequestAttempts', 'otpWrongAttempts'] },
        include: [
          {
            model: FreelancerProfileModel,
            as: 'profile',
            attributes: ['bio', 'profilePhoto', 'aadharCardFront', 'coverPhoto', 'aadharCardBack', 'createdBy', 'updatedBy', 'typeKey', 'isFeatured'],
          },
          {
            model: FreelancerBusinessModel,
            as: 'business',
            attributes: { exclude: ['companyName', 'userId', 'createdBy', 'updatedBy'] },
            include: [
              {
                model: CategoryModel,
                as: 'userCategory',
              },
              {
                model: CitiesModel,
                as: 'userCity',
                attributes: ['id', 'name'],
              },
              {
                model: StateModel,
                as: 'userState',
                attributes: ['id', 'name', 'countryCode'],
              },
              {
                model: CountriesModel,
                as: 'userCountry',
                attributes: ['id', 'name'],
              },
              {
                model: CitiesModel,
                as: 'userSecondaryLocation',
                attributes: ['id', 'name', 'stateCode', 'countryCode'],
              },
              {
                model: CitiesModel,
                as: 'userPrimaryLocation',
                attributes: ['id', 'name', 'stateCode', 'countryCode'],
              },
            ],
          },
          {
            model: FreelancerBadgeModel,
            as: 'badge',
            attributes: ['badgeId'],
          },
        ],
      },
    );

    if (!freelancer) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }

    const { profile, business, badge } = freelancer;

    freelancer = JSON.parse(JSON.stringify(freelancer));
    let userCategory;

    if (business) {
      userCategory = business?.userCategory;
      business.dataValues.cityId = business.dataValues.city;
      business.dataValues.stateId = business.dataValues.state;
      business.dataValues.countryId = business.dataValues.country;

      business.dataValues.city = {
        id: business?.userCity?.id,
        name: business?.userCity?.name,
      };

      business.dataValues.state = {
        id: business?.userState?.id,
        name: business?.userState?.name,
      };

      business.dataValues.country = {
        id: business?.userCountry?.id,
        name: business?.userCountry?.name,
      };

      business.dataValues.primaryLocation = {
        id: business?.userPrimaryLocation?.id,
        name: business?.userPrimaryLocation?.name,
      };

      business.dataValues.secondaryLocation = {
        id: business?.userSecondaryLocation?.id,
        name: business?.userSecondaryLocation?.name,
      };

      delete freelancer.business;
      freelancer = {
        ...freelancer,
        ...business.dataValues,
      };
    }

    if (profile) {
      delete freelancer.profile;
      freelancer = {
        ...freelancer,
        ...profile.dataValues,
      };
    }

    if (userCategory) {
      freelancer = {
        ...freelancer,
        ...userCategory.dataValues,
      };
    }

    delete freelancer.badge;

    freelancer.badgeIds = [];
    badge.forEach(obj => {
      freelancer.badgeIds.push(obj.badgeId);
    });

    if (freelancer) {
      if (freelancer.profilePhoto) {
        [freelancer.profilePhoto] = await getKeysAndGenerateUrl([freelancer.profilePhoto]);
      }
      if (freelancer.aadharCardFront) {
        [freelancer.aadharCardFront] = await getKeysAndGenerateUrl([freelancer.aadharCardFront]);
      }
      if (freelancer.aadharCardBack) {
        [freelancer.aadharCardBack] = await getKeysAndGenerateUrl([freelancer.aadharCardBack]);
      }
      if (freelancer.coverPhoto) {
        [freelancer.coverPhoto] = await getKeysAndGenerateUrl([freelancer.coverPhoto]);
      }
    }
    return freelancer;
  } catch (error) {
    freelancerLogger(`Error from get freelancer details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerDetails;
