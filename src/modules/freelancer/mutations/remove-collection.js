const deleteFreelancerPortfolioCollectionService = require('../../../rest/services/freelancers/delete-freelancer-portfolio-collection-service');
const freelancerLogger = require('../freelancer-logger');

const removeCollection = async (_, args, ctx) => {
  try {
    const { localeService } = ctx;
    const { id } = args;
    const response = deleteFreelancerPortfolioCollectionService(id, localeService);
    return response;
  } catch (error) {
    freelancerLogger(`Error from remove collection from admin: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = removeCollection;
