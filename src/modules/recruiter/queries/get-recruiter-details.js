const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const recruiterLogger = require('../recruiter-logger');

const getRecruiterDetails = async (_, args, ctx) => {
  try {
    const {
      models: {
        User: UserModel,
        UserBusiness: BusinessModel,
        UserProfile: ProfileModel,
        City: CitiesModel,
        State: StateModel,
        Country: CountriesModel,
      }, localeService,
    } = ctx;

    let recruiter = await UserModel.findOne(
      {
        where: { id: args.id, role: 'RECRUITER' },
        attributes: { exclude: ['password', 'refresh_token', 'otp', 'otpExpiry', 'isFeatured', 'otpRequestAttempts', 'otpWrongAttempts'] },
        include: [
          {
            model: ProfileModel,
            as: 'profile',
          },
          {
            model: BusinessModel,
            as: 'business',
            attributes: [
              'id', 'userId', 'companyName', 'addressLine1', 'addressLine2',
              'city', 'instagramLink', 'state', 'country', 'zipCode', 'createdBy', 'updatedBy',
            ],
            include: [
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

            ],
          },
        ],
      },
    );

    if (!recruiter) {
      throw new CustomApolloError(getMessage('RECRUITER_NOT_FOUND', localeService));
    }
    const { profile, business } = recruiter;

    recruiter = JSON.parse(JSON.stringify(recruiter));

    if (business) {
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

      delete recruiter.business;
      recruiter = {
        ...recruiter,
        ...business.dataValues,
      };
    }

    delete recruiter.badge;

    if (profile) {
      delete recruiter.profile;
      recruiter = {
        ...recruiter,
        ...profile.dataValues,
      };
    }

    if (recruiter) {
      if (recruiter.profilePhoto) {
        [recruiter.profilePhoto] = await getKeysAndGenerateUrl([recruiter.profilePhoto]);
      }
      if (recruiter.aadharCardFront) {
        [recruiter.aadharCardFront] = await getKeysAndGenerateUrl([recruiter.aadharCardFront]);
      }
      if (recruiter.aadharCardBack) {
        [recruiter.aadharCardBack] = await getKeysAndGenerateUrl([recruiter.aadharCardBack]);
      }
      if (recruiter.coverPhoto) {
        [recruiter.coverPhoto] = await getKeysAndGenerateUrl([recruiter.coverPhoto]);
      }
    }

    return recruiter;
  } catch (error) {
    recruiterLogger(`Error from get recruiter details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterDetails;
