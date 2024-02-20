const listFreelancerPortfolioCollectionsService = require('../../../rest/services/freelancers/list-freelancer-portfolio-collections-service');
const freelancerLogger = require('../freelancer-logger');

const listCollections = async (_, args, ctx) => {
  try {
    const { userId } = args;
    const response = await listFreelancerPortfolioCollectionsService(userId);
    return response;
  } catch (error) {
    freelancerLogger(`Error from list collections from admin: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listCollections;
