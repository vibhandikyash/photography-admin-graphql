
const Sequelize = require('sequelize');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const updateEventStatus = async (_, args, ctx) => {
  let transaction;
  try {
    const { localeService, models: { Event: EventModel } } = ctx;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const { data: { eventId, status } = {} } = args;

    const eventInstance = await EventModel.findByPk(eventId);

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    await eventInstance.update({ status });
    await transaction.commit();

    const response = {
      message: getMessage('EVENT_UPDATE_SUCCESSFULLY', localeService),
      status: 'SUCCESS',
    };

    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventLogger(`Error while update event status : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateEventStatus;
