/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { map } = require('lodash');

const {
  User: FreelancerModel,
  UserProfile: FreelancerProfileModel,
  UserBadge: FreelancerBadgeModel,
  Badge: BadgeModel,
  City: CityModel,
  UserBusiness: FreelancerBusinessModel,
} = require('../../../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../../../shared-lib/aws/functions/generate-url-for-keys');

const { sendSuccessResponse } = require('../../../../../utils/create-error');
const freelancersLogger = require('../../freelancers-logger');

const getFeaturedProfiles = async (req, res, next) => {
  try {
    const limit = 5;
    let freelancers = await FreelancerModel.findAll(
      {
        where: { verificationStatus: 'APPROVED', accountDeletedAt: null },
        attributes: ['id', 'fullName'],
        include: [
          {
            model: FreelancerProfileModel,
            as: 'profile',
            where: { isFeatured: true },
            attributes: ['coverPhoto', 'profilePhoto', 'isFeatured', 'typeKey', 'averageRating'],
          },
          {
            model: FreelancerBusinessModel,
            as: 'business',
            attributes: ['tagLine'],
            include: [
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
            model: FreelancerBadgeModel,
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
        limit,
      },
    );
    freelancers = JSON.parse(JSON.stringify(freelancers));

    for (const freelancer of freelancers) {
      if (freelancer.type === 'FREE') {
        delete freelancer.business?.secondaryLocation;
      }

      let badges = [];
      if (freelancer.badge) {
        badges = map(map(freelancer.badge, 'userBadge'), 'name');
        freelancer.badges = badges;
        delete freelancer.badge;
      }
      if (freelancer.profile.profilePhoto !== null) {
        [freelancer.profile.profilePhoto] = await getKeysAndGenerateUrl([freelancer.profile.profilePhoto]);
      }
      if (freelancer.profile.coverPhoto !== null) {
        [freelancer.profile.coverPhoto] = await getKeysAndGenerateUrl([freelancer.profile.coverPhoto]);
      }
    }

    return sendSuccessResponse(res, 'SUCCESS', 200, freelancers);
  } catch (error) {
    freelancersLogger(`Error from get-featured-profiles: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getFeaturedProfiles;
