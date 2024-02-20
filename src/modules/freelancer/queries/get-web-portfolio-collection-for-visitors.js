const getFreelancerPortfolioCollectionService = require('../../../rest/services/freelancers/get-freelancer-portfolio-collection-service');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const getWebPortfolioCollectionForVisitors = async (_, args, ctx) => {
  try {
    const { models: { User: UserModel }, localeService } = ctx;
    const { where: { collectionName = null, userName = null } = {} } = args;
    const user = await UserModel.findOne({ where: { userName } });
    if (!user) {
      throw new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }
    const response = await getFreelancerPortfolioCollectionService({ name: collectionName, userId: user.id }, localeService);
    return response;
  } catch (error) {
    freelancerLogger(`Error from getWebPortfolioCollectionForVisitors: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getWebPortfolioCollectionForVisitors;
