/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { QUERY_PAGING_MAX_COUNT, QUERY_PAGING_MIN_COUNT } = require('../../../../../config/config');
const { APPROVED } = require('../../../../../constants/service-constants');
const defaultLogger = require('../../../../../logger');

const {
  models:
  {
    UserProfile: UserProfileModel,
    UserReview: UserReviewModel,
    User: UserModel,
    Event: EventModel,
  },
} = require('../../../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../../../shared-lib/aws/functions/generate-url-for-keys');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const { INVALID_INPUT, OK } = require('../../../../services/http-status-codes');

const getReviews = async (req, res, next) => {
  try {
    const { id: userId } = req.params;

    let { query: { limit = QUERY_PAGING_MIN_COUNT } } = req;
    const { skip: offset } = req.query;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    if (!validateUUID(userId)) throw new ApiError('INVALID_INPUT', INVALID_INPUT);
    const attributes = ['id', 'review', 'overAllRating', 'communicationRating', 'punctualityRating', 'createdAt'];
    const reviewerAttributes = ['fullName', 'contactNo', 'role'];
    const reviews = await UserReviewModel.findAll({
      where: {
        userId,
        status: APPROVED,
      },
      include: [
        {
          model: UserModel,
          as: 'reviewer',
          attributes: reviewerAttributes,
          include: [
            {
              model: UserProfileModel,
              as: 'profile',
              attributes: ['profilePhoto'],
            },
          ],
        },
        {
          model: EventModel,
          as: 'event',
          attributes: ['name'],
        },
      ],
      limit,
      offset,
      attributes,
    });

    let data = [];

    if (reviews.length) {
      data = JSON.parse(JSON.stringify(reviews));
      // Calculate average rating
      for (const review of data) {
        if (review?.reviewer?.profile?.profilePhoto) {
          [review.reviewer.profile.profilePhoto] = await getKeysAndGenerateUrl([review.reviewer.profile.profilePhoto]);
        }
        review.averageRating = (review.overAllRating + review.communicationRating + review.punctualityRating) / 3;
      }
    }
    const response = {
      count: reviews.length,
      data,
    };
    return sendSuccessResponse(res, 'SUCCESS', OK, response);
  } catch (error) {
    defaultLogger(`Error in usr's get-reviews: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getReviews;
