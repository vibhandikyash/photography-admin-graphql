const listFreelancerPortfolioCollectionsService = require('../../../rest/services/freelancers/list-freelancer-portfolio-collections-service');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const listWebPortfolioCollectionsForVisitors = async (_, args, ctx) => {
  try {
    const { models: { User: UserModel }, localeService } = ctx;
    const { where: { userName = null } = {} } = args;
    const user = await UserModel.findOne({ where: { userName } });
    if (!user) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }
    const response = await listFreelancerPortfolioCollectionsService(user.id);
    return response;
  } catch (error) {
    freelancerLogger(`Error from listWebPortfolioCollectionsForVisitors: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listWebPortfolioCollectionsForVisitors;
