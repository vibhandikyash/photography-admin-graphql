const getFreelancerPortfolioCollectionService = require('../../../rest/services/freelancers/get-freelancer-portfolio-collection-service');
const freelancerLogger = require('../freelancer-logger');

const getFreelancerCollection = async (_, args, ctx) => {
  try {
    const { localeService } = ctx;
    const { id: collectionId } = args;
    const collection = await getFreelancerPortfolioCollectionService({ id: collectionId }, localeService);
    return collection;
  } catch (error) {
    freelancerLogger(`Error from get freelancer collection from admin: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerCollection;
