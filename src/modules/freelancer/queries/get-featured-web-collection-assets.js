const getFreelancerFeaturedAssetsService = require('../../../rest/services/get-freelancer-featured-assets');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const getFeaturedWebCollectionAssets = async (_, args, ctx) => {
  try {
    const { models: { User: UserModel }, localeService } = ctx;
    const { where: { userName } } = args;
    const user = await UserModel.findOne({ where: { userName, accountDeletedAt: null } });
    if (!user) {
      throw new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }
    const response = await getFreelancerFeaturedAssetsService(user.id);
    return response;
  } catch (error) {
    freelancerLogger(`Error from get freelancer featured web collection assets: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFeaturedWebCollectionAssets;
