const freelancerLogger = require('../freelancer-logger');
const getFreelancerWebBusinessDetailsService = require('../services/get-freelancer-web-business-details-service');

const getFreelancerWebBusinessDetailsForVisitors = async (_, args, ctx) => {
  try {
    const { localeService } = ctx;
    const { where: { userName = null } = {} } = args;
    const freelancer = await getFreelancerWebBusinessDetailsService({ userName }, localeService);
    return freelancer;
  } catch (error) {
    freelancerLogger(`Error from getFreelancerWebBusinessDetailsForVisitors: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebBusinessDetailsForVisitors;
