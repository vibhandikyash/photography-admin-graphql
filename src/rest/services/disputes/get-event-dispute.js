const {
  models: {
    Dispute: DisputeModel,
  },
} = require('../../../sequelize-client');

const recruitersLogger = require('../../modules/recruiters/recruiters-logger');

const getEventDispute = async (userId, eventId) => {
  try {
    let disputeInstance = await DisputeModel.findOne({
      where: { raisedBy: userId, eventId },
      attributes: ['id', 'ticketNo', 'eventId', 'userId', 'raisedBy', 'message', 'resolution', 'status', 'createdAt'],
    });

    disputeInstance = JSON.parse(JSON.stringify(disputeInstance));
    if (!disputeInstance) {
      return null;
    }
    return disputeInstance;
  } catch (error) {
    recruitersLogger(`Error from get-user-event-disputeInstance: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getEventDispute;
