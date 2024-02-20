const { validationResult } = require('express-validator');
const moment = require('moment');
const { Op } = require('sequelize');

const {
  FreelancerAttendance: FreelancerAttendanceModel,
  FreelancerAttendanceLog: FreelancerAttendanceLogModel,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const { ApiError } = require('../../../../services/custom-api-error');
const { NOT_FOUND, OK, VALIDATION_FAILED } = require('../../../../services/http-status-codes');

const freelancersLogger = require('../../freelancers-logger');

const eventClockOut = async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }
    const currentDate = moment().toISOString();

    const eventAttendanceInstance = await FreelancerAttendanceModel.findByPk(id);

    if (!eventAttendanceInstance) {
      throw new ApiError(getMessage('REQUIRED_LOG_NOT_FOUND'), NOT_FOUND);
    }

    await FreelancerAttendanceModel.update({ lastClockOut: currentDate }, { where: { id, userId: user.id } });
    const existingLogs = await FreelancerAttendanceLogModel.findOne(
      { where: { freelancerAttendanceId: id, clockIn: { [Op.ne]: null }, clockOut: null } },
    );

    if (existingLogs) {
      await existingLogs.update({ clockOut: currentDate });
    }
    const response = {
      message: getMessage('CLOCKED_OUT_SUCCESSFULLY'),
    };

    return sendSuccessResponse(res, 'SUCCESS', OK, response);
  } catch (error) {
    freelancersLogger(`Error from event-clock-out: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = eventClockOut;
