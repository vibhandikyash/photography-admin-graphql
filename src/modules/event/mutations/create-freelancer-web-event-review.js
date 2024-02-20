const moment = require('moment');

const {
  COMPLETED, RATINGS_VALIDITY_IN_DAYS, SUCCESS, EVENT_RATE_VALIDITY_IN_HOURS, APPROVED, WEDLANCER_ASSURED,
} = require('../../../constants/service-constants');
const calculateAverageRating = require('../../../rest/services/users/calculate-average-rating');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const createFreelancerWebEventReview = async (_, args, ctx) => {
  try {
    const {
      models: {
        Event: EventModel, UserReview: UserReviewModel, UserProfile: UserProfileModel, EventFreelancer: EventFreelancerModel,
      }, req: { user: { id: userId, verificationStatus } }, localeService,
    } = ctx;
    const { data = {}, where: { eventId = null, freelancerId = null } = {} } = args;

    const freelancer = await EventFreelancerModel.findOne({ where: { eventId, userId: freelancerId, isAssigned: true } });
    if (!freelancer) {
      throw new CustomApolloError('FREELANCER_NOT_FOUND', localeService);
    }

    const profile = await UserProfileModel.findOne({ where: { userId: freelancerId }, attributes: ['typeKey'] });
    const { typeKey } = profile;
    if (typeKey !== WEDLANCER_ASSURED) {
      throw new CustomApolloError(getMessage('REVIEW_IS_ONLY_ALLOWED_FOR_WEDLANCER_ASSURED', localeService));
    }
    if (verificationStatus !== APPROVED) {
      throw new CustomApolloError(getMessage('PROFILE_MUST_BE_APPROVED', localeService));
    }

    const event = await EventModel.findByPk(eventId);
    const { status, recruiterId } = event;
    if (!event || userId !== recruiterId) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    if (status !== COMPLETED) {
      throw new CustomApolloError(getMessage('REVIEW_IS_ALLOWED_AFTER_EVENT_COMPLETION', localeService));
    }

    const completedAt = moment(event.endDate);
    const completedDiff = moment().diff(completedAt, 'hours');
    if (completedDiff > EVENT_RATE_VALIDITY_IN_HOURS) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_RATE', localeService, { ratingsValidityInDays: RATINGS_VALIDITY_IN_DAYS }));
    }

    const existingReview = await UserReviewModel.findOne({ where: { reviewerId: userId, eventId, userId: freelancerId } });
    if (existingReview) throw new CustomApolloError('ALREADY_REVIEWED', localeService);

    const {
      review, overAllRating, communicationRating, punctualityRating,
    } = data;
    const reviewData = {
      userId: freelancerId,
      reviewerId: userId,
      eventId,
      review,
      overAllRating,
      communicationRating,
      punctualityRating,
    };
    await UserReviewModel.create(reviewData);
    calculateAverageRating(freelancerId);
    const response = { status: SUCCESS, message: getMessage('REVIEW_ADDED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    eventLogger(`Error creating freelancer web event review: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createFreelancerWebEventReview;
