const { validationResult } = require('express-validator');
const moment = require('moment');

const { eventRateMaxHours } = require('../../../../../constants/constants');
const { RATINGS_VALIDITY_IN_DAYS } = require('../../../../../constants/service-constants');

const {
  User: UserModel,
  UserProfile: UserProfileModel,
  UserReview: UserReviewModel,
  Event: EventModel,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  VALIDATION_FAILED, FORBIDDEN, CREATED, INVALID_INPUT, NOT_FOUND, BAD_REQUEST,
} = require('../../../../services/http-status-codes');
const calculateAverageRating = require('../../../../services/users/calculate-average-rating');
const eventLogger = require('../../event-logger');

const createRecruiterReviews = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }
    const { user, localeService } = req;
    // Only approved user are allowed
    const freelancerInstance = await UserModel.findOne({ where: { id: user.id, verificationStatus: 'APPROVED', accountDeletedAt: null } });
    if (!freelancerInstance) throw new ApiError('PROFILE_NOT_VERIFIED', FORBIDDEN);

    const {
      eventId, recruiterId, communicationRating, punctualityRating, overAllRating, review,
    } = req.body;

    if (!validateUUID(eventId) || !validateUUID(recruiterId)) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    // Only WEDLANCER_ASSURED user are allowed to rate.
    const profile = await UserProfileModel.findOne({
      where: {
        userId: user.id,
      },
    });
    if (!profile?.typeKey === 'WEDLANCER_ASSURED') throw new ApiError('ISSUE_RAISE_NOT_ALLOWED', FORBIDDEN);

    // Validate event
    const event = await EventModel.findByPk(eventId);
    if (!event) throw new ApiError('EVENT_NOT_FOUND', NOT_FOUND);
    if (event.status !== 'COMPLETED') throw new ApiError('EVENT_NOT_COMPLETED', BAD_REQUEST);

    // User can't rate after certain period
    const completedAt = moment(event.endDate, 'YYYY-MM-DD HH:mm:ss');
    const completedDiff = moment().diff(completedAt, 'hours');
    if (completedDiff > eventRateMaxHours) {
      throw new ApiError(getMessage('NOT_ALLOWED_TO_RATE', localeService, { ratingsValidityInDays: RATINGS_VALIDITY_IN_DAYS }), FORBIDDEN);
    }

    // validate user
    const recruiterInstance = await UserModel.findByPk(recruiterId);
    if (!recruiterInstance || recruiterInstance.role !== 'RECRUITER' || recruiterInstance.accountDeletedAt !== null) {
      throw new ApiError('USER_NOT_FOUND', NOT_FOUND);
    }

    // User is post review only once
    const userReviews = await UserReviewModel.findAll({ where: { reviewerId: user.id, eventId, userId: recruiterId } });
    if (userReviews.length) throw new ApiError('ALREADY_REVIEWED', BAD_REQUEST);

    const userReview = await UserReviewModel.create({
      userId: recruiterId,
      reviewerId: user.id,
      eventId,
      review,
      overAllRating,
      communicationRating,
      punctualityRating,
    }, {
      returning: true,
    });
    const response = JSON.parse(JSON.stringify(userReview));

    const averageRating = (response.overAllRating + response.communicationRating + response.punctualityRating) / 3;

    calculateAverageRating(recruiterId);
    response.averageRating = averageRating;
    delete response.updatedAt;
    delete response.createdAt;
    delete response.deletedAt;

    return sendSuccessResponse(res, 'SUCCESS', CREATED, response);
  } catch (error) {
    eventLogger(`Error from create-recruiter-reviews: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = createRecruiterReviews;
