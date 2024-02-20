const disputeLogger = require('../dispute-logger');

const getFreelancerWebEventDispute = async (_, args, ctx) => {
  try {
    const {
      models: { Dispute: DisputeModel, Event: EventModel }, req: { user: { id: userId } },
    } = ctx;
    const { where: { id: eventId = null } } = args;

    const event = await EventModel.findByPk(eventId);
    if (!event) {
      return null;
    }
    const dispute = await DisputeModel.findOne({ where: { eventId, raisedBy: userId } });
    // FE REQUIREMENT TO RETURN NULL INSTEAD OF ERROR
    if (!dispute) {
      return null;
    }
    const { message } = dispute;
    delete dispute.message;
    dispute.note = message;
    return dispute;
  } catch (error) {
    disputeLogger(`Error from getting freelancer web event dispute: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebEventDispute;
