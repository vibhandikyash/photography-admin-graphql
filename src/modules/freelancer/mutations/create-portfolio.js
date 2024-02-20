const createFreelancerPortfolioService = require('../../../rest/services/freelancers/create-freelancer-portfolio-service');

const freelancerLogger = require('../freelancer-logger');

const createPortfolio = async (_, args, ctx) => {
  try {
    const { req: { user: { id: loggedInUserId } }, localeService } = ctx;
    const { data, where: { id: userId } } = args;

    const response = await createFreelancerPortfolioService(data, userId, loggedInUserId, localeService);
    return response;
  } catch (error) {
    freelancerLogger(`Error creating freelancer-portfolio: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createPortfolio;
