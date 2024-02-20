const freelancerLogger = require('../freelancer-logger');
const getFreelancerWebProfileDetailsService = require('../services/get-freelancer-web-profile-details-service');

const getFreelancerWebProfileDetails = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId, role } }, localeService } = ctx;
    const freelancer = await getFreelancerWebProfileDetailsService({ id: userId }, role, localeService);
    return freelancer;
  } catch (error) {
    freelancerLogger(`Error from getting freelancer web profile details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebProfileDetails;
