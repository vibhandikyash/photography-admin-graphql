const {
  includes,
} = require('lodash');

const {
  freelancerDefaultVideoLimit,
  premiumFreelancerType, premiumFreelancerVideoLimit,
} = require('../../../../../constants/constants');
const defaultLogger = require('../../../../../logger');
const {
  models:
   {
     UserCollectionAsset: UserCollectionAssetModel,
     UserCollection: UserCollectionModel,
     UserProfile: UserProfileModel,
   },
} = require('../../../../../sequelize-client');

const { sendSuccessResponse } = require('../../../../../utils/create-error');
const getCollectionTypeOfUser = require('../../../../../utils/get-collection-type');
const { ApiError } = require('../../../../services/custom-api-error');
const { FORBIDDEN, OK } = require('../../../../services/http-status-codes');

const getAllVideos = async (req, res, next) => {
  try {
    const { user } = req;
    // Check the user's collection type ( only VIDEO collection type allowed to get videos )
    const userCollectionType = await getCollectionTypeOfUser(user.id);
    if (userCollectionType !== 'VIDEO') throw new ApiError('FORBIDDEN', FORBIDDEN);

    const { typeKey } = await UserProfileModel.findOne({ where: { userId: user.id }, attributes: ['typeKey'] });

    let limit = freelancerDefaultVideoLimit;
    if (includes(premiumFreelancerType, typeKey)) { // if user is premium type them change the limit
      limit = premiumFreelancerVideoLimit;
    }

    const collections = await UserCollectionModel.findAll({
      include: [
        {
          model: UserCollectionAssetModel,
          as: 'collectionAssets',
          attributes: ['id', 'title', 'url', 'isFeatured'],
          limit: 1,
        },
      ],
      where: { userId: user.id, type: 'VIDEO' },
      order: [
        ['createdAt', 'ASC'],
      ],
      attributes: ['id', 'name', 'type'],
      limit,
    });

    return sendSuccessResponse(res, 'SUCCESS', OK, collections);
  } catch (error) {
    defaultLogger(`Error in get-videos: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getAllVideos;
