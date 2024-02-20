const { Op } = require('sequelize');

const { SUCCESS } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');

const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const updateFreelancerWebDetails = async (_, args, ctx) => {
  try {
    const { models: { UserProfile: UserProfileModel, User: UserModel }, req: { user: { id: userId } }, localeService } = ctx;
    const { data: { bio, fullName, userName } } = args;

    if (userName) {
      const existingUserName = await UserModel.findOne({ where: { userName, id: { [Op.ne]: userId }, accountDeletedAt: null } });
      if (existingUserName) {
        throw new CustomApolloError(getMessage('USERNAME_ALREADY_EXISTS', localeService));
      }
    }

    const userData = { fullName, userName, updatedBy: userId };
    const userProfileData = { bio, updatedBy: userId };
    await UserModel.update(userData, { where: { id: userId } });
    await UserProfileModel.update(userProfileData, { where: { userId } });
    const response = { status: SUCCESS, message: getMessage('UPDATED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    freelancerLogger(`Error updating freelancer web details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateFreelancerWebDetails;
