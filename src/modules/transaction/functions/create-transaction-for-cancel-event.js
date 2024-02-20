const { map, isEmpty } = require('lodash');
const moment = require('moment');
const { Op } = require('sequelize');

const {
  CANCELLED, WEDLANCER_ASSURED, TRANSACTION_COMPLETED, BOOKING_FEES, COMMISSION, EVENT_FEES,
  CONFIGURATION_KEYS: { CONVENIENCE_FEES, EVENT_CANCELATION_HOURS, EVENT_CANCELATION_PERCENTAGES },
  PENDING,
  COMPLETED,
} = require('../../../constants/service-constants');
const {
  models: {
    User: UserModel, UserProfile: UserProfileModel, UserBusiness: UserBusinessModel,
    EventFreelancer: EventFreelancerModel, Event: EventModel, Transaction: TransactionModel,
  },
} = require('../../../sequelize-client');
const { getConfigByKey } = require('../../../shared-lib/configurations');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const {
  getDifferenceBetweenEventStartDateAndCurrentDate,
  getUsersTransactionDataForCancelationCharges,
} = require('../../event/functions/cancel-event-data-parser');
const transactionLogger = require('../transaction-logger');

const createTransactionForCancelEvent = async (eventId, transaction, ctx) => {
  try {
    const { localeService } = ctx;

    const eventInstance = await EventModel.findByPk(eventId, { transaction });

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const { id, recruiterId } = eventInstance;

    const eventAssignedFreelancers = await EventFreelancerModel.findAll({
      where: { eventId: id, isAssigned: true },
      include: [
        {
          model: UserModel,
          as: 'eventFreelancers',
          include: [{ model: UserProfileModel, as: 'profile', where: { typeKey: WEDLANCER_ASSURED } }],
        },
      ],
      transaction,
    });

    if (!eventAssignedFreelancers.length) {
      throw new CustomApolloError(getMessage('EVENT_FREELANCERS_NOT_FOUND', localeService));
    }

    const recruiterInstance = await UserModel.findByPk(eventInstance.recruiterId, {
      attributes: ['id'], include: [{ model: UserBusinessModel, as: 'business', attributes: ['userId', 'totalBalance'] }],
    });

    if (eventAssignedFreelancers.length) {
      const freelancerIds = map(eventAssignedFreelancers, 'userId');
      const recruiterTransactionDetails = await TransactionModel.findAll({
        where: {
          eventId,
          userId: eventInstance.recruiterId,
          freelancerId: { [Op.in]: freelancerIds },
          transactionType: { [Op.in]: [BOOKING_FEES, CONVENIENCE_FEES] },
          transactionStatus: TRANSACTION_COMPLETED,
        },
        raw: true,
      });

      if (recruiterTransactionDetails.length) {
        const now = moment();
        const [eventCancelationHours, eventCancelationPercentage] = await getConfigByKey([EVENT_CANCELATION_HOURS, EVENT_CANCELATION_PERCENTAGES]);
        const eventDateDifference = await getDifferenceBetweenEventStartDateAndCurrentDate(eventInstance?.startDate, now, eventCancelationHours, ctx);

        const [recruiterRefundBookingFeesTransaction, recruiterRefundConvenienceFees, recruiterCancelationFeesData,
          recruiterNewTotalBalance,
        ] = await getUsersTransactionDataForCancelationCharges(recruiterTransactionDetails, recruiterInstance,
          eventDateDifference, eventCancelationPercentage);

        if (!isEmpty(recruiterCancelationFeesData)) {
          await TransactionModel.bulkCreate([recruiterRefundBookingFeesTransaction, recruiterRefundConvenienceFees, recruiterCancelationFeesData],
            { transaction });
        } else {
          await TransactionModel.bulkCreate([recruiterRefundBookingFeesTransaction, recruiterRefundConvenienceFees], { transaction });
        }

        // UPDATE THE TRANSACTION STATUS ON CANCELLATION
        await Promise.all([
          await TransactionModel.update({ transactionStatus: CANCELLED }, {
            where: { eventId, transactionType: { [Op.in]: [COMMISSION] }, transactionStatus: [COMPLETED, PENDING] }, transaction,
          }),
          await TransactionModel.update({ transactionStatus: CANCELLED }, {
            where: { eventId, transactionType: { [Op.in]: [EVENT_FEES] }, transactionStatus: [COMPLETED, PENDING] }, transaction,
          }),
          await TransactionModel.update({ transactionStatus: CANCELLED }, {
            where: {
              eventId, userId: recruiterId, transactionType: { [Op.in]: [BOOKING_FEES, CONVENIENCE_FEES] }, transactionStatus: TRANSACTION_COMPLETED,
            },
            transaction,
          }),
          await UserBusinessModel.update(recruiterNewTotalBalance, { where: { userId: eventInstance?.recruiterId }, transaction }),
        ]);
      }
    }
  } catch (error) {
    transactionLogger(`Error while cancelEventTransaction : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createTransactionForCancelEvent;
