/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { Op } = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../../../config/config');
const { FREELANCER, SUCCESS } = require('../../../../../constants/service-constants');
const {
  User: UserModel,
  UserProfile: UserProfileModel,
} = require('../../../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../../../shared-lib/aws/functions/generate-url-for-keys');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');
const topUpRequestsLogger = require('../../../top-up-requests/top-up-requests-logger');

const freelancers = async (req, res, next) => {
  try {
    let { query: { limit = QUERY_PAGING_MIN_COUNT } } = req;
    const { skip: offset = 0, search } = req.query;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const condition = {
      role: FREELANCER,
      isActive: true,
      accountDeletedAt: null,
    };
    if (search) {
      condition.fullName = {
        [Op.iLike]: `%${search}%`,
      };
    }

    let listFreelancers = await UserModel.findAll({
      where: condition,
      attributes: ['id', 'fullName', 'email', 'contactNo'],
      include: [
        {
          model: UserProfileModel,
          as: 'profile',
          attributes: ['profilePhoto'],
        },
      ],
      limit,
      offset,
    });

    const freelancersCount = await UserModel.count({
      where: condition,
    });

    listFreelancers = JSON.parse(JSON.stringify(listFreelancers));

    for (const freelancer of listFreelancers) {
      if (freelancer?.profile?.profilePhoto) {
        [freelancer.profile.profilePhoto] = await getKeysAndGenerateUrl([freelancer?.profile?.profilePhoto]);
      }
    }

    const result = {
      count: freelancersCount,
      freelancers: listFreelancers,
    };
    return sendSuccessResponse(res, SUCCESS, OK, result);
  } catch (error) {
    topUpRequestsLogger(`Error from list-freelancers: ${error}`, res, 'error');
    return next(error);
  }
};

module.exports = freelancers;
