const { validationResult } = require('express-validator');
const moment = require('moment');

const {
  EventTiming: EventTimingModel,
  FreelancerAttendanceLog: FreelancerAttendanceLogModel,
  FreelancerAttendance: FreelancerAttendanceModel,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const { ApiError } = require('../../../../services/custom-api-error');
const { NOT_FOUND, OK, VALIDATION_FAILED } = require('../../../../services/http-status-codes');

const freelancersLogger = require('../../freelancers-logger');

const eventOtpVerification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }
    const { user } = req;
    const { eventId, otp } = req.body;
    const currentDate = moment();

    const eventOtpInstance = await FreelancerAttendanceModel.findOne({
      where: { eventId, otp, userId: user.id },
      attributes: ['id', 'otp', 'firstClockIn'],
      include: [
        {
          model: EventTimingModel,
          as: 'eventTimings',
          attributes: ['id', 'startDate', 'endDate'],
        },
      ],
    });

    if (!eventOtpInstance) {
      throw new ApiError(getMessage('WRONG_OTP'), NOT_FOUND);
    }

    const { startDate, endDate } = eventOtpInstance.eventTimings;
    if (!currentDate.isBetween(startDate, endDate)) {
      throw new ApiError(getMessage('OTP_NOT_FOUND'), NOT_FOUND);
    }

    // set otp to null
    if (eventOtpInstance.firstClockIn === null) {
      await eventOtpInstance.update({ otp: null, firstClockIn: currentDate.toISOString() });
    }
    const logData = {
      eventId,
      userId: user.id,
      clockIn: currentDate.toISOString(),
      freelancerAttendanceId: eventOtpInstance.id,
    };

    await FreelancerAttendanceLogModel.create(logData);
    const response = {
      message: getMessage('OTP_VERIFIED_SUCCESSFULLY'),
    };

    return sendSuccessResponse(res, 'SUCCESS', OK, response);
  } catch (error) {
    freelancersLogger(`Error from otp-verification: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = eventOtpVerification;
