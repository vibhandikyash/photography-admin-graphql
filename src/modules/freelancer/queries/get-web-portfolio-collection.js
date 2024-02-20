const getFreelancerPortfolioCollectionService = require('../../../rest/services/freelancers/get-freelancer-portfolio-collection-service');
const freelancerLogger = require('../freelancer-logger');

const getWebPortfolioCollection = async (_, args, ctx) => {
  try {
    const { localeService, req: { user: { id: userId } } } = ctx;
    const { where: { id: collectionId = null } = null } = args;
    const response = await getFreelancerPortfolioCollectionService({ id: collectionId, userId }, localeService);
    return response;
  } catch (error) {
    freelancerLogger(`Error from getting freelancer-portfolio collection for web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getWebPortfolioCollection;
