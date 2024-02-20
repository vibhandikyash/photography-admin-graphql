const { SUCCESS } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  sequelize, Sequelize, models: { UserCollection: FreelancerCollectionModel, UserCollectionAsset: FreelancerCollectionAssetsModel },
} = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');

const deleteFreelancerPortfolioCollectionService = async (collectionId, localeService) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const collectionInstance = await FreelancerCollectionModel.findOne({ where: { id: collectionId } });
    if (!collectionInstance) {
      throw new CustomApolloError(getMessage('COLLECTION_NOT_FOUND', localeService));
    }

    await FreelancerCollectionAssetsModel.destroy({ where: { collectionId }, transaction });
    await FreelancerCollectionModel.destroy({ where: { id: collectionId }, transaction });

    await transaction.commit();

    const response = {
      status: SUCCESS,
      message: getMessage('COLLECTION_REMOVED', localeService),
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    defaultLogger(`Error from deleting freelancer portfolio collection service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = deleteFreelancerPortfolioCollectionService;
