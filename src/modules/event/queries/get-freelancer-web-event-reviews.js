/* eslint-disable no-restricted-syntax */
const { Op } = require('sequelize');

const { APPROVED } = require('../../../constants/service-constants');

const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const getFreelancerWebEventReviews = async (_, args, ctx) => {
  try {
    const {
      models: { UserReview: UserReviewModel, Event: EventModel }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;

    const event = await EventModel.findByPk(eventId);
    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const reviews = await UserReviewModel.findAll({
      where: { [Op.or]: [{ reviewerId: userId }, { userId, status: APPROVED }], eventId },
      attributes: ['id', 'review', 'overAllRating', 'communicationRating', 'punctualityRating', 'status', 'reviewerId', 'userId', 'eventId'],
    });
    return reviews;
  } catch (error) {
    eventLogger(`Error from getting freelancer web event reviews: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebEventReviews;
