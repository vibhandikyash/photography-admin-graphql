const { filter, find } = require('lodash');

const { Op } = require('sequelize');

const {
  EVENT_FEES, BOOKING_FEES, REGULARIZE_REQUEST_TYPES: { REGULARIZE }, DEFAULT_TIMEZONE,
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  RegularizeRequest: RegularizeRequestModel, User: UserModel,
  EventTiming: EventTimingModel, Event: EventModel, Transaction: TransactionModel,
} = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const {
  REGULARIZE_REQUEST_APPROVED_FREELANCER_EMAIL,
  REGULARIZE_REQUEST_APPROVED_RECRUITER_EMAIL,
  INSUFFICIENT_HOURS_REQUEST_APPROVED_FREELANCER_EMAIL,
  INSUFFICIENT_HOURS_REQUEST_APPROVED_RECRUITER_EMAIL,
} = require('../constants/email-template-constants');
const formatEmailDateTimeWithTimeZone = require('../services/format-email-date-time-with-time-zone');

const sendEmailToFreelancerForRegularizeRequestApproved = async (regularizeRequestId, isTransactionUpdate = false) => {
  try {
    const regularizeRequest = await RegularizeRequestModel.findByPk(regularizeRequestId, {
      attributes: ['startedAt', 'endedAt', 'metaData', 'requestType'],
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'email', 'fullName'],
        }, {
          model: EventModel,
          as: 'event',
          attributes: ['name', 'timeZone'],
          include: { model: UserModel, as: 'recruiter', attributes: ['email', 'fullName'] },
        }, {
          model: EventTimingModel,
          as: 'eventTiming',
          attributes: ['id'],
        }],
    });

    const {
      user: { email: freelancerEmail, fullName: freelancerName },
      event: { name: eventName, recruiter: { email: recruiterEmail, fullName: recruiterName }, timeZone = DEFAULT_TIMEZONE },
    } = regularizeRequest;

    const {
      startedAt, endedAt, requestType,
      metaData: { freelancerAttendances: { firstClockIn, lastClockOut } = {}, oldNoOfDays, updatedNoOfDays } = {},
    } = regularizeRequest;

    let templateData = {
      recruiterName,
      freelancerName,
      eventName,
      isTransactionUpdate,
      actualStartTime: formatEmailDateTimeWithTimeZone(firstClockIn, timeZone),
      actualEndTime: formatEmailDateTimeWithTimeZone(lastClockOut, timeZone),
      updatedStartTime: formatEmailDateTimeWithTimeZone(startedAt, timeZone),
      updatedEndTime: formatEmailDateTimeWithTimeZone(endedAt, timeZone),
      oldNoOfDays,
      updatedNoOfDays,
    };

    if (isTransactionUpdate) {
      const regularizeRequestTransaction = await TransactionModel.findAll({
        attributes: ['amount', 'transactionType', 'metaData'],
        where: {
          [Op.or]: [
            { metaData: { regularizeRequests: { cancelledById: regularizeRequestId } } },
            { metaData: { regularizeRequests: { createdById: regularizeRequestId } } },
          ],
        },
      });
      // get previous transaction data
      const previousTransactionData = filter(regularizeRequestTransaction, ['metaData.regularizeRequests.cancelledById', regularizeRequestId]);
      const previousEventFees = find(previousTransactionData, { transactionType: EVENT_FEES });
      const previousBookingFees = find(previousTransactionData, { transactionType: BOOKING_FEES });
      // get updated transaction data
      const updatedTransactionData = filter(regularizeRequestTransaction, ['metaData.regularizeRequests.createdById', regularizeRequestId]);
      const updatedEventFees = find(updatedTransactionData, { transactionType: EVENT_FEES });
      const updatedBookingFees = find(updatedTransactionData, { transactionType: BOOKING_FEES });
      templateData = {
        ...templateData,
        previousEventFees: Math.ceil(previousEventFees.amount),
        previousBookingFees: Math.ceil(previousBookingFees.amount),
        updatedEventFees: Math.ceil(updatedEventFees.amount),
        updatedBookingFees: Math.ceil(updatedBookingFees.amount),
      };
    }

    // send mail to freelancer
    let emailTemplate = {
      templateKey: requestType === REGULARIZE
        ? REGULARIZE_REQUEST_APPROVED_FREELANCER_EMAIL
        : INSUFFICIENT_HOURS_REQUEST_APPROVED_FREELANCER_EMAIL,
      toEmailAddress: freelancerEmail,
      data: templateData,
    };
    sendEmail(emailTemplate);

    // send mail to recruiter
    emailTemplate = {
      templateKey: requestType === REGULARIZE
        ? REGULARIZE_REQUEST_APPROVED_RECRUITER_EMAIL
        : INSUFFICIENT_HOURS_REQUEST_APPROVED_RECRUITER_EMAIL,
      toEmailAddress: recruiterEmail,
      data: templateData,
    };
    sendEmail(emailTemplate);
  } catch (error) {
    defaultLogger(`Error from sendEmailToFreelancerForRegularizeRequestApproved : ${error}`, null, 'error');
  }
};

module.exports = sendEmailToFreelancerForRegularizeRequestApproved;
