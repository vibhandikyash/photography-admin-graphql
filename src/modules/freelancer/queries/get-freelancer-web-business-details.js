const freelancerLogger = require('../freelancer-logger');
const getFreelancerWebBusinessDetailsService = require('../services/get-freelancer-web-business-details-service');

const getFreelancerWebBusinessDetails = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } }, localeService } = ctx;
    const freelancer = await getFreelancerWebBusinessDetailsService({ id: userId }, localeService);
    return freelancer;
  } catch (error) {
    freelancerLogger(`Error from getting freelancer web business details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebBusinessDetails;
