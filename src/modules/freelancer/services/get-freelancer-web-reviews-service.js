const { APPROVED } = require('../../../constants/service-constants');
const { models: { UserReview: UserReviewModel } } = require('../../../sequelize-client');
const freelancerLogger = require('../freelancer-logger');

const getFreelancerWebReviewsService = async (where = {}, limit, skip) => {
  try {
    const condition = { ...where, status: APPROVED };
    const reviews = await UserReviewModel.findAll({
      where: condition,
      limit,
      offset: skip,
      order: [['createdAt', 'DESC']],
    });
    const count = await UserReviewModel.count({ where: condition });
    return { count, reviews };
  } catch (error) {
    freelancerLogger(`Error from getFreelancerWebReviewsService: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebReviewsService;
