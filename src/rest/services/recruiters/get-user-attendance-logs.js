const moment = require('moment');
const { Op } = require('sequelize');

const {
  models: {
    FreelancerAttendance: FreelancerAttendanceModel,
    EventTiming: EventTimingModel,
    RegularizeRequest: RegularizeRequestModel,
  },
} = require('../../../sequelize-client');

const recruitersLogger = require('../../modules/recruiters/recruiters-logger');

const getUserAttendanceLogs = async (userId, eventId, onlyPreviousData = true) => {
  try {
    let eventTimingWhere = {};
    const includeOptions = [];
    if (onlyPreviousData === true) {
      eventTimingWhere = {
        startDate: {
          [Op.lt]: moment().endOf('day').format(),
        },
      };
      includeOptions.push({
        model: RegularizeRequestModel,
        as: 'regularizeRequests',
        attributes: ['status'],
      });
    }

    let attendanceLogs = await FreelancerAttendanceModel.findAll({
      where: { userId, eventId },
      attributes: ['id', 'otp', 'eventTimingsId', 'firstClockIn', 'lastClockOut'],
      include: [
        {
          model: EventTimingModel,
          as: 'eventTimings',
          attributes: ['startDate', 'endDate'],
          where: eventTimingWhere,
          required: true,
          include: includeOptions,
        },
      ],
      order: [
        [{ model: EventTimingModel, as: 'eventTimings' }, 'startDate', 'DESC'],
      ],
    });

    attendanceLogs = JSON.parse(JSON.stringify(attendanceLogs));

    if (!attendanceLogs) {
      return null;
    }

    return attendanceLogs;
  } catch (error) {
    recruitersLogger(`Error from get-user-event-attendanceLogs: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getUserAttendanceLogs;
