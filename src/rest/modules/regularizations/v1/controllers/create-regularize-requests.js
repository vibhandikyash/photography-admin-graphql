/* eslint-disable max-len */
/* eslint-disable prefer-const */
const { validationResult } = require('express-validator');
const { map } = require('lodash');
const moment = require('moment');

const { PENDING, REGULARIZE_REQUEST_TYPES: { REGULARIZE }, EVENT_HOURS_DIFF } = require('../../../../../constants/service-constants');

const {
  Event: EventModel, EventTiming: EventTimingModel, EventFreelancer: EventFreelancerModel, RegularizeRequest: RegularizeRequestModel,
  FreelancerAttendance: FreelancerAttendanceModel,
} = require('../../../../../sequelize-client');
const sendEmailForRegularizeRequestSubmitted = require('../../../../../shared-lib/emails/regularise/send-email-for-regularize-request-submitted');
const createNotificationForRegularizeRequestSubmissionToFreelancer = require('../../../../../shared-lib/notifications/regularize-requests/create-notification-for-regularize-request-submission-to-freelancer');
const createNotificationForRegularizeRequestToAdmin = require('../../../../../shared-lib/notifications/regularize-requests/create-notification-for-regularize-request-to-admin');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const validateUUID = require('../../../../../utils/validate-uuid');

const { ApiError } = require('../../../../services/custom-api-error');
const {
  BAD_REQUEST,
  FORBIDDEN,
  OK,
  NOT_FOUND,
  VALIDATION_FAILED,
  INVALID_INPUT,
} = require('../../../../services/http-status-codes');
const regularizationLogger = require('../../regularizations-logger');

const regularizeRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message
      throw new ApiError(extractedError, VALIDATION_FAILED);
    }

    const { user, localeService } = req;

    let { params: { id: eventId }, body: { startDate, endDate, eventTimingId } } = req;

    if (!validateUUID(eventId)) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    const eventTimingsInstance = await EventTimingModel.findByPk(eventTimingId, { attributes: ['id', 'startDate', 'endDate'] });
    if (!eventTimingsInstance) {
      throw new ApiError('LOGS_NOT_FOUND', BAD_REQUEST);
    }

    const eventInstance = await EventModel.findByPk(eventId,
      {
        attributes: ['id', 'startDate', 'endDate'],
        include: {
          model: EventFreelancerModel,
          as: 'freelancers',
          where: { isAssigned: true },
          attributes: ['userId'],
          required: false,
        },
      });

    if (!eventInstance) {
      throw new ApiError('EVENT_NOT_FOUND', NOT_FOUND);
    }
    const eventFreelancerIds = map(eventInstance.freelancers, 'userId');
    if (!eventFreelancerIds.includes(user.id)) {
      throw new ApiError(getMessage('NOT_ALLOWED_TO_SEND_REQUEST'), FORBIDDEN);
    }

    const currentDate = moment().format();

    // Check if the eventTimingsInstanceTime is already created or not
    const eventTimingsInstanceTimings = await RegularizeRequestModel.findOne({ where: { eventTimingId, userId: user.id, status: PENDING } });
    if (eventTimingsInstanceTimings) {
      throw new ApiError(getMessage('REGULARIZE_ALREADY_CREATED'), FORBIDDEN);
    }

    // validate request to be sent after the event end time
    if (moment(currentDate).isBefore(eventTimingsInstance.endDate)) {
      throw new ApiError(getMessage('CANNOT_SEND_REQUEST_BEFORE_EVENT_END_TIME'), BAD_REQUEST);
    }

    // validate the timings entry before 24 hours of the event end date
    const endEventNextDay = moment(eventInstance.endDate).add(EVENT_HOURS_DIFF, 'hours');
    if (moment(currentDate).isAfter(endEventNextDay)) {
      throw new ApiError(getMessage('REQUEST_END_DATE_VALIDATION', localeService, { hours: EVENT_HOURS_DIFF }), BAD_REQUEST);
    }
    startDate = moment(startDate);
    endDate = moment(endDate);

    // validate startDate and endDate
    if (startDate.isAfter(endDate)) {
      throw new ApiError(getMessage('STARTDATE_MUST_NOT_EXCEED_ENDDATE'), BAD_REQUEST);
    }
    const inputDateDiff = endDate.diff(startDate, 'hours');
    if (inputDateDiff > EVENT_HOURS_DIFF) {
      throw new ApiError(getMessage('TOTAL_HOURS_VALIDATION_MESSAGE', localeService, { hours: EVENT_HOURS_DIFF }), BAD_REQUEST);
    }
    const existingFreelancerAttendance = await FreelancerAttendanceModel.findOne({
      where: { eventTimingsId: eventTimingId, userId: user.id },
    });
    const { firstClockIn, lastClockOut } = existingFreelancerAttendance;
    const freelancerAttendances = { firstClockIn, lastClockOut };

    const data = {
      userId: user.id,
      startedAt: startDate,
      endedAt: endDate,
      status: PENDING,
      eventId,
      eventTimingId,
      requestType: REGULARIZE,
      metaData: { freelancerAttendances },
    };

    const requestData = await RegularizeRequestModel.create(data);

    if (requestData) {
      createNotificationForRegularizeRequestSubmissionToFreelancer(user.id, requestData.id, localeService);
      createNotificationForRegularizeRequestToAdmin(requestData.id, localeService);
      sendEmailForRegularizeRequestSubmitted(requestData.id);
    }
    return sendSuccessResponse(res, 'REGULARIZE_REQUEST_SENT_SUCCESSFULLY', OK);
  } catch (error) {
    regularizationLogger(`Error from create-regularize-request: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = regularizeRequest;
