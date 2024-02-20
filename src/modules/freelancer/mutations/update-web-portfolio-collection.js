const updateFreelancerPortfolioCollectionService = require('../../../rest/services/freelancers/update-freelancer-portfolio-collection-service');
const freelancerLogger = require('../freelancer-logger');

const updateWebPortfolioCollection = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } }, localeService } = ctx;
    const { data, where: { id: collectionId } } = args;
    const response = await updateFreelancerPortfolioCollectionService(data, userId, userId, collectionId, localeService);
    return response;
  } catch (error) {
    freelancerLogger(`Error updating freelancer-portfolio collection for web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateWebPortfolioCollection;
