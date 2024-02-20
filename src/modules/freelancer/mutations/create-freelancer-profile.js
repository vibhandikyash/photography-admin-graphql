const { Op } = require('sequelize');

const { SUCCESS } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const createFreelancerProfile = async (_, args, ctx) => {
  try {
    const {
      models: {
        User: UserModel,
        UserBusiness: UserBusinessModel,
        UserProfile: UserProfileModel,
      },
      req: { user: { id: userId } },
      localeService,
    } = ctx;

    const {
      data: {
        fullName, userName, profilePhoto = null, categoryId, instagramLink = null, aadharCardFront, aadharCardBack, primaryLocation,
      } = {},
    } = args;
    if (userName) {
      const existingUserName = await UserModel.findOne({ where: { userName, id: { [Op.ne]: userId }, accountDeletedAt: null } });
      if (existingUserName) {
        throw new CustomApolloError(getMessage('USERNAME_ALREADY_EXISTS', localeService));
      }
    }
    await Promise.all([
      UserModel.update({ fullName, userName }, { where: { id: userId } }),
      UserBusinessModel.update({ instagramLink, categoryId, primaryLocation }, { where: { userId } }),
      UserProfileModel.update({ profilePhoto, aadharCardFront, aadharCardBack }, { where: { userId } }),
    ]);

    const response = {
      status: SUCCESS,
      message: getMessage('FREELANCER_PROFILE_CREATED', localeService),
    };

    return response;
  } catch (error) {
    freelancerLogger(`Error creating freelancer profile for web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createFreelancerProfile;
