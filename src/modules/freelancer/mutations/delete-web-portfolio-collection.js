const deleteFreelancerPortfolioCollectionService = require('../../../rest/services/freelancers/delete-freelancer-portfolio-collection-service');
const freelancerLogger = require('../freelancer-logger');

const deleteWebPortfolioCollection = async (_, args, ctx) => {
  try {
    const { localeService } = ctx;
    const { where: { id: collectionId } } = args;
    const response = deleteFreelancerPortfolioCollectionService(collectionId, localeService);
    return response;
  } catch (error) {
    freelancerLogger(`Error from deleting freelancer-portfolio collection for web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = deleteWebPortfolioCollection;
