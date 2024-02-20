/* eslint-disable no-restricted-syntax */
const { Op } = require('sequelize');

const { APPROVED, COMPLETED, WEDLANCER_ASSURED } = require('../../../constants/service-constants');

const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const getRecruiterWebEventReviews = async (_, args, ctx) => {
  try {
    const {
      models: {
        UserReview: UserReviewModel, Event: EventModel, EventFreelancer: EventFreelancerModel, UserProfile: UserProfileModel,
      }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { eventId, freelancerId } } = args;

    const event = await EventModel.findByPk(eventId, {
      include: { model: EventFreelancerModel, as: 'freelancers', where: { userId: freelancerId, isAssigned: true } },
    });
    if (!event || event.recruiterId !== userId) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const { status } = event;

    const freelancer = await UserProfileModel.findOne({ where: { userId: freelancerId }, attributes: ['typeKey'] });
    const { typeKey } = freelancer;
    if (status !== COMPLETED || typeKey !== WEDLANCER_ASSURED) {
      throw new CustomApolloError(getMessage('USER_REVIEW_NOT_FOUND', localeService));
    }
    const reviews = await UserReviewModel.findAll({
      where: { [Op.or]: [{ reviewerId: userId, userId: freelancerId }, { userId, reviewerId: freelancerId, status: APPROVED }], eventId },
      attributes: ['id', 'review', 'overAllRating', 'communicationRating', 'punctualityRating', 'status', 'reviewerId', 'userId', 'eventId'],
    });
    return reviews;
  } catch (error) {
    eventLogger(`Error from getting recruiter web event reviews: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterWebEventReviews;
