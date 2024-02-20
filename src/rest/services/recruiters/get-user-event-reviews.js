const { APPROVED } = require('../../../constants/service-constants');
const {
  models: {
    UserReview: UserReviewModel,
  },
} = require('../../../sequelize-client');

const recruitersLogger = require('../../modules/recruiters/recruiters-logger');

const getUserEventReview = async (reviewerId, userId, eventId, onlyApproved = false) => {
  try {
    const reviewsWhereCondition = {
      userId,
      eventId,
      reviewerId,
    };

    // fetch only approved reviews
    if (onlyApproved) {
      reviewsWhereCondition.status = APPROVED;
    }

    const reviews = await UserReviewModel.findOne({
      where: reviewsWhereCondition,
      attributes: ['id', 'userId', 'reviewerId', 'overAllRating', 'communicationRating', 'punctualityRating', 'review', 'status'],
      raw: true,
    });

    if (!reviews) {
      return null;
    }

    return reviews;
  } catch (error) {
    recruitersLogger(`Error from get-user-event-reviews: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getUserEventReview;
