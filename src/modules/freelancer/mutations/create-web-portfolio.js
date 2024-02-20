const createFreelancerPortfolioService = require('../../../rest/services/freelancers/create-freelancer-portfolio-service');
const freelancerLogger = require('../freelancer-logger');

const createWebPortfolio = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } }, localeService } = ctx;
    const { data } = args;
    const response = await createFreelancerPortfolioService(data, userId, userId, localeService);
    return response;
  } catch (error) {
    freelancerLogger(`Error creating freelancer-portfolio for web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createWebPortfolio;
