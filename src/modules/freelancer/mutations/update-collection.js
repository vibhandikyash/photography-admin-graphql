const updateFreelancerPortfolioCollectionService = require('../../../rest/services/freelancers/update-freelancer-portfolio-collection-service');
const freelancerLogger = require('../freelancer-logger');

const updateCollection = async (_, args, ctx) => {
  try {
    const { req: { user: { id: loggedInUserId } }, localeService } = ctx;
    const { data, where: { collectionId, userId } } = args;

    const response = await updateFreelancerPortfolioCollectionService(data, userId, loggedInUserId, collectionId, localeService);
    return response;
  } catch (error) {
    freelancerLogger(`Error updating freelancer collection from admin: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateCollection;
