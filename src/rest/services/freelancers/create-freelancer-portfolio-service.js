const { pick } = require('lodash');

const {
  IMAGE, FREE, CONFIGURATION_KEYS, VIDEO, WEDLANCER_ASSURED, PREMIUM, SUCCESS,
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const {
  models: {
    User: UserModel, UserProfile: FreelancerProfileModel,
    UserCollection: FreelancerCollectionModel,
    UserCollectionAsset: FreelancerCollectionAssetsModel,
  },
} = require('../../../sequelize-client');
const { getConfigByKey } = require('../../../shared-lib/configurations');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const getCollectionTypeOfUser = require('../../../utils/get-collection-type');
const { getMessage } = require('../../../utils/messages');

const COLLECTION = ['name'];
const COLLECTION_ASSETS = ['url', 'title', 'isFeatured'];

const createFreelancerPortfolioService = async (data, userId, loggedInUserId, localeService) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const freelancerInstance = await UserModel.findOne({ where: { id: userId, role: 'FREELANCER', accountDeletedAt: null } });

    if (!freelancerInstance) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }

    const profile = await FreelancerProfileModel.findOne({ where: { userId }, attributes: ['typeKey'] });
    const { typeKey } = profile;

    // get user category type
    const type = await getCollectionTypeOfUser(userId);
    let countKey;
    let assetsLimitKey;

    if (typeKey === FREE && type === IMAGE) {
      countKey = CONFIGURATION_KEYS.FREE_COLLECTION_LIMIT;
      assetsLimitKey = CONFIGURATION_KEYS.FREE_IMAGE_LIMIT;
    } else if (typeKey === FREE && type === VIDEO) {
      assetsLimitKey = CONFIGURATION_KEYS.FREE_VIDEO_LINK_LIMIT;
      countKey = CONFIGURATION_KEYS.FREE_VIDEO_LINK_LIMIT;
    } else if (typeKey === WEDLANCER_ASSURED && type === IMAGE) {
      countKey = CONFIGURATION_KEYS.WEDLANCER_ASSURED_COLLECTION_LIMIT;
      assetsLimitKey = CONFIGURATION_KEYS.WEDLANCER_ASSURED_IMAGE_LIMIT;
    } else if (typeKey === WEDLANCER_ASSURED && type === VIDEO) {
      assetsLimitKey = CONFIGURATION_KEYS.WEDLANCER_ASSURED_VIDEO_LINK_LIMIT;
      countKey = CONFIGURATION_KEYS.WEDLANCER_ASSURED_VIDEO_LINK_LIMIT;
    } else if (typeKey === PREMIUM && type === IMAGE) {
      countKey = CONFIGURATION_KEYS.PREMIUM_COLLECTION_LIMIT;
      assetsLimitKey = CONFIGURATION_KEYS.PREMIUM_IMAGE_LIMIT;
    } else if (typeKey === PREMIUM && type === VIDEO) {
      assetsLimitKey = CONFIGURATION_KEYS.PREMIUM_VIDEO_LINK_LIMIT;
      countKey = CONFIGURATION_KEYS.PREMIUM_VIDEO_LINK_LIMIT;
    }

    const [assetsLimitValue, countValue] = await getConfigByKey([assetsLimitKey, countKey]);

    const collectionCount = await FreelancerCollectionModel.count({ where: { userId } });

    if (collectionCount >= Number(countValue)) {
      throw new CustomApolloError(getMessage('COLLECTION_LIMIT_EXCEEDED', localeService));
    }

    const freelancerCollection = pick(data, COLLECTION);

    const existingCollection = await FreelancerCollectionModel.findOne({ where: { userId, name: freelancerCollection.name } });
    if (existingCollection) {
      throw new CustomApolloError(getMessage('COLLECTION_ALREADY_EXISTS', localeService));
    }

    const { collectionAssets: freelancerCollectionAssets } = data;

    freelancerCollection.userId = userId;
    freelancerCollection.type = type;
    freelancerCollection.createdBy = loggedInUserId;
    freelancerCollection.collectionAssets = [];

    if (freelancerCollectionAssets?.length > Number(assetsLimitValue)) {
      throw new CustomApolloError(getMessage('COLLECTION_ASSETS_LIMIT_EXCEEDED', localeService));
    }

    freelancerCollectionAssets?.forEach(async collection => {
      const collectionAssets = pick(collection, COLLECTION_ASSETS);
      if (type === VIDEO) {
        collectionAssets.title = freelancerCollection.name;
      }
      collectionAssets.userId = userId;
      collectionAssets.createdBy = loggedInUserId;
      freelancerCollection.collectionAssets.push(collectionAssets);
    });
    // assigning the child data to the parent data through aliases
    const freelancer = await FreelancerCollectionModel.create(freelancerCollection, {
      include: [
        {
          model: FreelancerCollectionAssetsModel,
          as: 'collectionAssets',
        },
      ],
      transaction,
    });
    await transaction.commit();
    const response = {
      status: SUCCESS,
      message: getMessage('FREELANCER_PORTFOLIO_CREATED', localeService),
      freelancer,
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    defaultLogger(`Error from creating freelancer portfolio collection service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = createFreelancerPortfolioService;
