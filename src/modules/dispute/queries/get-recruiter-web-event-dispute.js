const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const disputeLogger = require('../dispute-logger');

const getRecruiterWebEventDispute = async (_, args, ctx) => {
  try {
    const {
      models: { Dispute: DisputeModel, Event: EventModel, User: UserModel }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { eventId = null, freelancerId = null } = {} } = args;

    const event = await EventModel.findByPk(eventId);
    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const freelancer = await UserModel.findByPk(freelancerId);
    if (!freelancer) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }
    const dispute = await DisputeModel.findOne({ where: { eventId, raisedBy: userId, userId: freelancerId } });

    // FE REQUIREMENT TO RETURN NULL INSTEAD OF ERROR
    if (!dispute) {
      return null;
    }
    const { message } = dispute;
    delete dispute.message;
    dispute.note = message;
    return dispute;
  } catch (error) {
    disputeLogger(`Error from getting recruiter web event dispute: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterWebEventDispute;
