/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

const axios = require('axios');
const { get, map } = require('lodash');
const Sequelize = require('sequelize');

const { REPORT_SERVER_URL, INTERNAL_SERVER_SECRET_KEY } = require('../../../config/config');
const { WEDLANCER_ASSURED, REPORT_SERVER_ROUTES: { REFUND_ROUTE } } = require('../../../constants/service-constants');
const { sequelize } = require('../../../sequelize-client');
const sendEmailForEventCancelledByFreelancer = require('../../../shared-lib/emails/event/send-email-for-event-cancelled-by-freelancer');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const createNotificationForEventCancellationByFreelancer = require('../../../shared-lib/notifications/events/create-notification-for-event-cancellation-by-freelancer');
const createNotificationForRemovedFreelancerToRecruiter = require('../../../shared-lib/notifications/events/create-notification-for-removed-freelancer-to-recruiter');
const { getMessage } = require('../../../utils/messages');
const createTransactionForRemoveFreelancer = require('../../transaction/functions/create-transaction-for-remove-freelancer');
const eventLogger = require('../event-logger');
const removeWedlancerCoordinator = require('../functions/remove-wedlancer-coordinator');

const removeFreelancerFromEvent = async (_, args, ctx) => {
  let transaction;
  try {
    const { localeService } = ctx;
    const { data } = args;
    const { req: { user } } = ctx;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      FreelancerCalender: FreelancerCalenderModel, EventFreelancer: EventFreelancerModel, EventTiming: EventTimingsModel, Event: EventModel,
      FreelancerAttendance: FreelancerAttendanceModel, User: UserModel, UserProfile: UserProfileModel,
    } = ctx.models;

    const { eventId, freelancerId } = data;

    const eventInstance = await EventModel.findByPk(eventId);

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    const [freelancerInstance, eventFreelancerInstance, eventTimingsInstance] = await Promise.all([
      UserModel.findOne({
        where: {
          id: freelancerId,
        },
        include: [
          {
            model: UserProfileModel,
            as: 'profile',
          },
        ],
      }),
      EventFreelancerModel.findOne({
        where: {
          eventId,
          userId: freelancerId,
          isAssigned: true,
        },
      }),
      EventTimingsModel.findAll({ where: { eventId } }),
    ]);

    if (!eventFreelancerInstance) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_ASSIGNED_TO_EVENT', localeService));
    }

    const dataToBeUpdateObj = { isAssigned: false };
    const where = { eventId, userId: freelancerId };

    const freelancerProfileType = get(freelancerInstance, 'profile.typeKey');
    const eventTimingIds = map(eventTimingsInstance, 'id');

    if (freelancerProfileType === WEDLANCER_ASSURED) {
      await createTransactionForRemoveFreelancer(eventId, eventFreelancerInstance.userId, transaction, ctx);
      await Promise.all([
        FreelancerCalenderModel.destroy({
          where: { eventId, userId: freelancerId },
          transaction,
        }),
        FreelancerAttendanceModel.destroy({ where: { eventTimingsId: eventTimingIds, userId: freelancerId }, transaction }),
        EventFreelancerModel.update(dataToBeUpdateObj, { where, transaction }),
        // SEND NOTIFICATION TO THE RECRUITER
        createNotificationForRemovedFreelancerToRecruiter(user.id, eventInstance, freelancerId, localeService),
        // SEND NOTIFICATION TO THE FREELANCER
        createNotificationForEventCancellationByFreelancer(user.id, eventInstance, freelancerId, localeService),
      ]);
    } else {
      await Promise.all([
        FreelancerCalenderModel.destroy({
          where: { eventId, userId: freelancerId },
          transaction,
        }),
        EventFreelancerModel.update(dataToBeUpdateObj, { where, transaction }),
      ]);
    }

    await removeWedlancerCoordinator(eventInstance.id, transaction, ctx);

    if (freelancerProfileType === WEDLANCER_ASSURED) {
      try {
        const { data: axiosResponse = {} } = await axios.post(`${REPORT_SERVER_URL}${REFUND_ROUTE}`, {
          eventId,
          freelancerId,
        }, { headers: { internal_server_secret: INTERNAL_SERVER_SECRET_KEY } });

        const { data: { key = '' } = {} } = axiosResponse;
        // SEND EMAIL TO RECRUITER FOR FREELANCER REMOVED
        await sendEmailForEventCancelledByFreelancer(eventId, freelancerId, key);
      } catch (error) {
        eventLogger(`Error while generating freelancer refund invoice : ${error}`, ctx, 'error');
      }
    }

    await transaction.commit();

    const response = {
      message: getMessage('FREELANCER_REMOVED_SUCCESSFULLY', localeService),
      status: 'SUCCESS',
    };

    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventLogger(`Error while remove freelancer from event : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = removeFreelancerFromEvent;
