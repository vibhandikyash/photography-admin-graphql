/* eslint-disable no-restricted-syntax */
const freelancerLogger = require('../freelancer-logger');
const getFreelancerWebDetailsService = require('../services/get-freelancer-web-details-service');

const getFreelancerWebDetailsForVisitors = async (_, args, ctx) => {
  try {
    const { localeService } = ctx;
    const { where: { userName = null } = {} } = args;
    const freelancer = await getFreelancerWebDetailsService({ userName }, localeService);
    return freelancer;
  } catch (error) {
    freelancerLogger(`Error from getFreelancerWebDetailsForVisitors: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebDetailsForVisitors;
