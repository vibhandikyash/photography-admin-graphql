/* eslint-disable no-restricted-syntax */
const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');
const getFreelancerWebReviewsService = require('../services/get-freelancer-web-reviews-service');

const getFreelancerWebReviewsForVisitors = async (_, args, ctx) => {
  try {
    const { models: { User: UserModel }, localeService } = ctx;
    let { filter: { limit = QUERY_PAGING_MIN_COUNT } } = args;
    const { filter: { skip = 0 }, where: { userName = null } = {} } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const user = await UserModel.findOne({ where: { userName } });
    if (!user) {
      throw new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }
    const { count, reviews } = await getFreelancerWebReviewsService({ userId: user.id }, limit, skip);

    return { count, data: reviews };
  } catch (error) {
    freelancerLogger(`Error from getFreelancerWebReviewsForVisitors: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebReviewsForVisitors;
