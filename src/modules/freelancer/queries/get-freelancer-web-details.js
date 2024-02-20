/* eslint-disable no-restricted-syntax */
const freelancerLogger = require('../freelancer-logger');
const getFreelancerWebDetailsService = require('../services/get-freelancer-web-details-service');

const getFreelancerWebDetails = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } }, localeService } = ctx;
    const freelancer = await getFreelancerWebDetailsService({ id: userId }, localeService);
    return freelancer;
  } catch (error) {
    freelancerLogger(`Error from getting freelancer web details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebDetails;
