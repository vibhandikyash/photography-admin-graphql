const moment = require('moment');

const {
  WEDLANCER_ASSURED, COMPLETED, RATINGS_VALIDITY_IN_DAYS, SUCCESS, EVENT_RATE_VALIDITY_IN_HOURS,
} = require('../../../constants/service-constants');
const calculateAverageRating = require('../../../rest/services/users/calculate-average-rating');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const createRecruiterWebEventReview = async (_, args, ctx) => {
  try {
    const {
      models: {
        User: UserModel, Event: EventModel, UserProfile: UserProfileModel, UserReview: UserReviewModel, EventFreelancer: EventFreelancerModel,
      }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { data = {}, where: { id: eventId = null } = {} } = args;

    const event = await EventModel.findByPk(eventId, {
      include: { model: EventFreelancerModel, as: 'freelancers', where: { isAssigned: true, userId } },
    });
    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const { status, recruiterId } = event;
    if (status !== COMPLETED) {
      throw new CustomApolloError(getMessage('REVIEW_IS_ALLOWED_AFTER_EVENT_COMPLETION', localeService));
    }

    const profile = await UserProfileModel.findOne({ where: { userId }, attributes: ['typeKey'] });
    const { typeKey } = profile;
    if (typeKey !== WEDLANCER_ASSURED) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_REVIEW', localeService));
    }

    const completedAt = moment(event.endDate);
    const completedDiff = moment().diff(completedAt, 'hours');
    if (completedDiff > EVENT_RATE_VALIDITY_IN_HOURS) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_RATE', localeService, { ratingsValidityInDays: RATINGS_VALIDITY_IN_DAYS }));
    }

    const recruiterInstance = await UserModel.findByPk(recruiterId);
    if (!recruiterInstance || recruiterInstance.accountDeletedAt !== null) throw new CustomApolloError('USER_NOT_FOUND', localeService);

    const existingReview = await UserReviewModel.findOne({ where: { reviewerId: userId, eventId, userId: recruiterId } });
    if (existingReview) throw new CustomApolloError('ALREADY_REVIEWED', localeService);

    const {
      review, overAllRating, communicationRating, punctualityRating,
    } = data;
    const reviewData = {
      userId: recruiterId,
      reviewerId: userId,
      eventId,
      review,
      overAllRating,
      communicationRating,
      punctualityRating,
    };
    await UserReviewModel.create(reviewData);
    calculateAverageRating(recruiterId);
    const response = { status: SUCCESS, message: getMessage('REVIEW_ADDED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    eventLogger(`Error creating recruiter web event review: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createRecruiterWebEventReview;
