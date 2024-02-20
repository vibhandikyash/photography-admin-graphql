const listFreelancerPortfolioCollectionsService = require('../../../rest/services/freelancers/list-freelancer-portfolio-collections-service');
const freelancerLogger = require('../freelancer-logger');

const listWebPortfolioCollections = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } } } = ctx;
    const response = await listFreelancerPortfolioCollectionsService(userId);
    return response;
  } catch (error) {
    freelancerLogger(`Error from listing freelancer-portfolio collections for web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listWebPortfolioCollections;
