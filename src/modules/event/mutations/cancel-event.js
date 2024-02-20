const { map } = require('lodash');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');

const { CANCELLED, WEDLANCER_ASSURED, COMPLETED } = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const createTransactionForCancelEvent = require('../../transaction/functions/create-transaction-for-cancel-event');
const eventLogger = require('../event-logger');
const {
  getDetailsForUpdateEvent,
} = require('../functions/cancel-event-data-parser');

const cancelEvent = async (_, args, ctx) => {
  let transaction;
  try {
    const { req, localeService } = ctx;
    const { user } = req;
    const { data } = args;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      FreelancerCalender: FreelancerCalenderModel, EventFreelancer: EventFreelancerModel, Event: EventModel,
      UserProfile: UserProfileModel,
    } = ctx.models;
    const { eventId, note } = data;

    const eventInstance = await EventModel.findByPk(eventId);

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    if (eventInstance.status === CANCELLED || eventInstance.status === COMPLETED) {
      throw new CustomApolloError(getMessage('EVENT_CANNOT_BE_CANCEL', localeService));
    }

    if (!eventInstance.assignedTo === user.id) {
      throw new CustomApolloError(getMessage('NOT_AUTHORIZED_TO_PERFORM_THIS_ACTION', localeService));
    }

    const [dataToBeUpdate, where] = await getDetailsForUpdateEvent(user, eventId, note);
    await EventModel.update(dataToBeUpdate, { where, transaction });

    const [checkFreelancerCalender, checkEventFreelancer] = await Promise.all([
      FreelancerCalenderModel.findAll({
        where: { eventId },
      }),
      EventFreelancerModel.findAll({
        where: { eventId, isAssigned: true },
      }),
    ]);

    const eventFreelancerIds = map(checkEventFreelancer, 'userId');

    const wedlancerAssuredFreelancers = await UserProfileModel.findAll({
      where: {
        userId: {
          [Op.in]: eventFreelancerIds,
        },
        typeKey: WEDLANCER_ASSURED,
      },
    });

    const wedlancerAssuredFreelancersIds = map(wedlancerAssuredFreelancers, 'userId');

    if (wedlancerAssuredFreelancersIds.length) {
      await createTransactionForCancelEvent(eventId, transaction, ctx);
    }

    if (checkFreelancerCalender && checkFreelancerCalender.length) {
      await FreelancerCalenderModel.destroy({
        where: { eventId },
        transaction,
      });
    }

    await transaction.commit();

    const response = {
      message: getMessage('EVENT_CANCELLED_SUCCESSFULLY', localeService),
      status: 'SUCCESS',
    };

    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventLogger(`Error while cancel event : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = cancelEvent;
