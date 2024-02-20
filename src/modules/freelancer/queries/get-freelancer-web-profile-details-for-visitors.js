const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');
const getFreelancerWebProfileDetailsService = require('../services/get-freelancer-web-profile-details-service');

const getFreelancerWebProfileDetailsForVisitors = async (_, args, ctx) => {
  try {
    const { models: { User: UserModel }, localeService } = ctx;
    const { where: { userName = null } = {} } = args;
    const user = await UserModel.findOne({ where: { userName }, attributes: ['role'] });
    if (!user) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }
    const { role } = user;
    const freelancer = await getFreelancerWebProfileDetailsService({ userName }, role, localeService);
    return freelancer;
  } catch (error) {
    freelancerLogger(`Error from getFreelancerWebProfileDetailsForVisitors: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebProfileDetailsForVisitors;
