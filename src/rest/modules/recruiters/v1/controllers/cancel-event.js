/* eslint-disable max-len */

const { map } = require('lodash');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');

const { WEDLANCER_ASSURED } = require('../../../../../constants/service-constants');
const { getDetailsForUpdateEvent } = require('../../../../../modules/event/functions/cancel-event-data-parser');
const createTransactionForCancelEvent = require('../../../../../modules/transaction/functions/create-transaction-for-cancel-event');
const {
  Event: EventModel, FreelancerCalender: FreelancerCalenderModel, EventFreelancer: EventFreelancerModel, UserProfile: UserProfileModel, sequelize,
} = require('../../../../../sequelize-client');
const sendEmailForEventCancelledByRecruiter = require('../../../../../shared-lib/emails/event/send-email-for-event-cancelled-by-recruiter');
const createNotificationForEventCancellationForFreelancers = require('../../../../../shared-lib/notifications/events/create-notification-for-event-cancellation-for-freelancers');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  INVALID_INPUT, BAD_REQUEST, OK, FORBIDDEN, NOT_FOUND,
} = require('../../../../services/http-status-codes');
const eventLogger = require('../../../events/event-logger');

const cancelRecruiterEvent = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const { user, localeService } = req;
    const { eventId } = req.body;
    if (!validateUUID(eventId)) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    const eventInstance = await EventModel.findByPk(eventId);
    if (!eventInstance) throw new ApiError('EVENT_NOT_FOUND', NOT_FOUND);

    if (!eventInstance.assignedTo === user.id) throw new ApiError('NOT_AUTHORIZED_TO_PERFORM_THIS_ACTION', FORBIDDEN);

    if (eventInstance.status !== 'UPCOMING') throw new ApiError('EVENT_NOT_CANCELLABLE', BAD_REQUEST);

    const [dataToBeUpdate, where] = await getDetailsForUpdateEvent(user, eventInstance.id);
    await EventModel.update(dataToBeUpdate, { where, transaction });

    const [checkFreelancerCalender, checkEventFreelancer] = await Promise.all([
      FreelancerCalenderModel.findAll({ where: { eventId } }),
      EventFreelancerModel.findAll({ where: { eventId, isAssigned: true } }),
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

    if (wedlancerAssuredFreelancers.length) {
      await createTransactionForCancelEvent(eventId, transaction, req);
    }

    if (checkFreelancerCalender && checkFreelancerCalender.length) {
      await FreelancerCalenderModel.destroy({ where: { eventId }, transaction });
    }

    sendEmailForEventCancelledByRecruiter(eventInstance, checkEventFreelancer);

    // SENT NOTIFICATION FOR EVENT CANCELLATION TO THE FREELANCERS
    if (wedlancerAssuredFreelancers.length) {
      createNotificationForEventCancellationForFreelancers(eventInstance, wedlancerAssuredFreelancers, localeService);
    }
    await transaction.commit();

    return sendSuccessResponse(res, 'SUCCESS', OK);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventLogger(`Error from cancel-event: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = cancelRecruiterEvent;
