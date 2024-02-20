const { SUCCESS } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const deleteWebCollectionAsset = async (_, args, ctx) => {
  try {
    const { models: { UserCollectionAsset: UserCollectionAssetModel }, localeService } = ctx;
    const { where: { id } } = args;
    const existingCollectionAsset = await UserCollectionAssetModel.findByPk(id);
    if (!existingCollectionAsset) {
      throw new CustomApolloError(getMessage('COLLECTION_ASSET_NOT_FOUND', localeService));
    }
    await UserCollectionAssetModel.destroy({ where: { id } });
    const response = { status: SUCCESS, message: getMessage('ASSET_DELETED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    freelancerLogger(`Error deleting freelancer web collection asset: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = deleteWebCollectionAsset;

