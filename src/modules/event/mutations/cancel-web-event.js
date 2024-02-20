const { map } = require('lodash');
const { Op } = require('sequelize');

const { CANCELLED, WEDLANCER_ASSURED } = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const createTransactionForCancelEvent = require('../../transaction/functions/create-transaction-for-cancel-event');
const eventLogger = require('../event-logger');

const cancelWebEvent = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      models: {
        FreelancerCalender: FreelancerCalenderModel, EventFreelancer: EventFreelancerModel, Event: EventModel, UserProfile: UserProfileModel,
      }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;
    const event = await EventModel.findByPk(eventId);
    if (!event || event.recruiterId !== userId) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND'), localeService);
    }
    const { status } = event;
    if (status === CANCELLED) {
      throw new CustomApolloError(getMessage('EVENT_ALREADY_CANCELLED', localeService));
    }
    await EventModel.update({ status: CANCELLED, cancelledBy: userId }, { where: { id: eventId } });

    const [checkFreelancerCalender, checkEventFreelancer] = await Promise.all([
      FreelancerCalenderModel.findAll({ where: { eventId } }),
      EventFreelancerModel.findAll({ where: { eventId, isAssigned: true } }),
    ]);
    const eventFreelancerIds = map(checkEventFreelancer, 'userId');

    const wedlancerAssuredFreelancers = await UserProfileModel.findAll({
      where: { userId: { [Op.in]: eventFreelancerIds }, typeKey: WEDLANCER_ASSURED },
    });
    const wedlancerAssuredFreelancersIds = map(wedlancerAssuredFreelancers, 'userId');

    if (wedlancerAssuredFreelancersIds.length) {
      await createTransactionForCancelEvent(eventId, transaction, ctx);
    }
    if (checkFreelancerCalender && checkFreelancerCalender.length) {
      await FreelancerCalenderModel.destroy({ where: { eventId }, transaction });
    }
    await transaction.commit();
    const response = { status: 'SUCCESS', message: getMessage('EVENT_CANCELLED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventLogger(`Error from cancel web event: ${error}`, ctx, 'error');
    throw error;
  }
};
module.exports = cancelWebEvent;
