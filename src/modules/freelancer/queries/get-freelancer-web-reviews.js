/* eslint-disable no-restricted-syntax */
const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const freelancerLogger = require('../freelancer-logger');
const getFreelancerWebReviewsService = require('../services/get-freelancer-web-reviews-service');

const getFreelancerWebReviews = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } } } = ctx;
    let { filter: { limit = QUERY_PAGING_MIN_COUNT } } = args;
    const { filter: { skip = 0 } } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const { count, reviews } = await getFreelancerWebReviewsService({ userId }, limit, skip);

    return { count, data: reviews };
  } catch (error) {
    freelancerLogger(`Error from getting freelancer web review details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebReviews;
