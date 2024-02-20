const { SUCCESS } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');

const updateUserReviewStatus = async (_, args, ctx) => {
  try {
    const { models: { UserReview: UserReviewModel }, localeService } = ctx;
    const { data: { status }, where: { id } } = args;

    // check user review exist or not
    const userReview = await UserReviewModel.findByPk(id);
    if (!userReview) {
      throw new CustomApolloError(getMessage('USER_REVIEW_NOT_FOUND', localeService));
    }

    // update user review
    await UserReviewModel.update({ status }, { where: { id } });

    const response = {
      status: SUCCESS,
      message: getMessage('USER_REVIEW_STATUS_CHANGED', localeService),
    };
    return response;
  } catch (error) {
    eventsLogger(`Error updating organic-event: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateUserReviewStatus;
