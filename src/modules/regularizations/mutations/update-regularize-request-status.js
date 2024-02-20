/* eslint-disable max-len */
const { get } = require('lodash');
const moment = require('moment');

const {
  PENDING, APPROVED, SUCCESS, DEFAULT_TIMEZONE, REGULARIZE_REQUEST_TYPES: { REGULARIZE }, REGULARIZE_REQUEST_UPDATE_STATUS_VALIDITY_IN_HOURS,
} = require('../../../constants/service-constants');
const updateTransactionOnRequestApproval = require('../../../rest/services/regularizations/update-transaction-on-request-approval');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const sendEmailToFreelancerForRegularizeRequestApproved = require('../../../shared-lib/emails/regularise/send-email-to-freelancer-for-regularize-request-approved');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const createNotificationForRegularizeRequestApprovalToFreelancer = require('../../../shared-lib/notifications/regularize-requests/create-notification-for-regularize-request-approval-to-freelancer');
const createNotificationForRegularizeRequestApprovalToRecruiter = require('../../../shared-lib/notifications/regularize-requests/create-notification-for-regularize-request-approval-to-recruiter');
const { getMessage } = require('../../../utils/messages');
const regularizationLogger = require('../regularization-logger');
const checkExtraHoursCriteria = require('../services/check-extra-hours-criteria');
const getEventDaysForRegularization = require('../services/get-event-days-for-regularization');

const updateRegularizeRequestStatus = async (_, args, ctx) => {
  let transaction;
  try {
    const {
      models: {
        RegularizeRequest: RegularizeRequestModel, Event: EventModel, FreelancerAttendance: FreelancerAttendanceModel,
        FreelancerAttendanceLog: FreelancerAttendanceLogModel, EventTiming: EventTimingModel,
      }, localeService,
      req: { user: { id: userId } },
    } = ctx;
    const { where: { id: requestId }, data: { status } } = args;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const existingRequest = await RegularizeRequestModel.findByPk(requestId);
    if (!existingRequest || existingRequest.status !== PENDING) {
      throw new CustomApolloError(getMessage('REGULARIZE_REQUEST_NOT_FOUND', localeService));
    }

    const {
      startedAt: currentRequestStartedAt, endedAt: currentRequestEndedAt, userId: freelancerId, eventId, requestType, eventTimingId, createdAt, metaData: existingRequestMetaData,
    } = existingRequest;

    const statusUpdateHoursDiff = moment().diff(createdAt, 'hours');
    if (statusUpdateHoursDiff > REGULARIZE_REQUEST_UPDATE_STATUS_VALIDITY_IN_HOURS) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_UPDATE_STATUS', localeService, { requestApprovalValidity: REGULARIZE_REQUEST_UPDATE_STATUS_VALIDITY_IN_HOURS }));
    }
    // GET THE ACTUAL EVENT TIMING
    const eventTimings = await EventTimingModel.findByPk(eventTimingId);

    // GET THE PREVIOUS LATEST APPROVED REQUEST
    const previousApprovedRequest = await RegularizeRequestModel.findAll({
      where: {
        userId: freelancerId, eventTimingId, eventId, status: APPROVED, requestType: REGULARIZE,
      },
      limit: 1,
      order: [['updatedAt', 'desc']],
    });

    const event = await EventModel.findByPk(eventId);
    const { timeZone: eventTimeZone = DEFAULT_TIMEZONE } = event;

    let message;
    let isTransactionUpdated = false;
    if (status === APPROVED) {
      let metaDataToBeUpdated;
      let isPreviousRequestExtraHours = false;
      const isCurrentRequestExtraHours = checkExtraHoursCriteria(eventTimeZone, currentRequestStartedAt, currentRequestEndedAt, ctx);

      // CHECK THE PREVIOUS APPROVED REQUEST EXTRA HOURS AND IF NOT FOUND CHECK THE EVENT TIMINGS EXTRA HOURS
      if (!previousApprovedRequest.length) {
        // CHECK THE EVENT TIMING EXTRA HOURS
        if (eventTimings) {
          const { startDate: eventTimingStartedAt, endDate: eventTimingEndedAt } = eventTimings;
          isPreviousRequestExtraHours = checkExtraHoursCriteria(eventTimeZone, eventTimingStartedAt, eventTimingEndedAt, ctx);
        }
      }
      let requestInstance;
      if (previousApprovedRequest.length) {
        requestInstance = get(previousApprovedRequest, '[0]');
        const { startedAt: previousRequestStartedAt, endedAt: previousRequestEndedAt } = requestInstance;
        isPreviousRequestExtraHours = checkExtraHoursCriteria(eventTimeZone, previousRequestStartedAt, previousRequestEndedAt, ctx);
      }
      if (isCurrentRequestExtraHours && !isPreviousRequestExtraHours) {
        isTransactionUpdated = true;
        metaDataToBeUpdated = await updateTransactionOnRequestApproval(ctx, eventId, freelancerId, requestId, requestType, false, transaction);
      } else if (!isCurrentRequestExtraHours && isPreviousRequestExtraHours) {
        isTransactionUpdated = true;
        metaDataToBeUpdated = await updateTransactionOnRequestApproval(ctx, eventId, freelancerId, requestId, requestType, isTransactionUpdated, transaction);
      } else {
        // UPDATE THE NO OF DAYS OF THE REQUEST
        const previousRequestMetaData = get(requestInstance, 'metaData');

        // GET THE EVENT TIMINGS NO OF DAYS IF THE PREVIOUS REQUEST IS NOT FOUND
        if (!previousRequestMetaData) {
          const eventTimingInstances = await EventTimingModel.findAll({ where: { eventId } });
          const totalNoOfEventDays = await getEventDaysForRegularization(eventTimeZone, eventTimingInstances, ctx);
          metaDataToBeUpdated = { ...existingRequestMetaData, oldNoOfDays: totalNoOfEventDays, updatedNoOfDays: totalNoOfEventDays };
        }
        if (previousRequestMetaData) {
          const { updatedNoOfDays = 0 } = previousRequestMetaData;
          metaDataToBeUpdated = { ...existingRequestMetaData, oldNoOfDays: updatedNoOfDays, updatedNoOfDays };
        }
      }
      // UPDATE THE STATUS AND FREELANCER ATTENDANCE LOGS
      const existingFreelancerAttendance = await FreelancerAttendanceModel.findOne({
        where: { eventTimingsId: eventTimingId, userId: freelancerId },
      });
      await existingRequest.update({ status, metaData: metaDataToBeUpdated }, { transaction });
      await existingFreelancerAttendance.update({ firstClockIn: currentRequestStartedAt, lastClockOut: currentRequestEndedAt }, { transaction });
      await FreelancerAttendanceLogModel.update(
        { clockIn: currentRequestStartedAt, clockOut: currentRequestEndedAt },
        { where: { eventId, userId: freelancerId }, transaction },
      );
      // SEND NOTIFICATION TO FREELANCER AND RECRUITER
      createNotificationForRegularizeRequestApprovalToFreelancer(userId, existingRequest, isTransactionUpdated, localeService);
      createNotificationForRegularizeRequestApprovalToRecruiter(userId, existingRequest, isTransactionUpdated, localeService);
      await transaction.commit();

      // SEND EMAIL FOR REGULARIZE REQUEST APPROVED
      sendEmailToFreelancerForRegularizeRequestApproved(requestId, isTransactionUpdated);

      message = getMessage('REQUEST_APPROVED', localeService);
    } else {
      // UPDATE THE STATUS
      await RegularizeRequestModel.update({ status }, { where: { id: requestId } }, { transaction });
      await transaction.commit();
      message = getMessage('REQUEST_REJECTED', localeService);
    }
    const response = { status: SUCCESS, message };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    regularizationLogger(`Error from update regularize request status, ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateRegularizeRequestStatus;
