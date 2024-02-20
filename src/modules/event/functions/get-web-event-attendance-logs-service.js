const moment = require('moment');
const { Op } = require('sequelize');

const {
  models: { FreelancerAttendance: FreelancerAttendanceModel, EventTiming: EventTimingModel, RegularizeRequest: RegularizeRequestModel },
} = require('../../../sequelize-client');

const eventLogger = require('../event-logger');

const getWebEventAttendanceLogsService = async (userId, eventId) => {
  try {
    let attendanceLogs = await FreelancerAttendanceModel.findAll({
      where: { userId, eventId },
      attributes: ['id', 'firstClockIn', 'lastClockOut'],
      include: [
        {
          model: EventTimingModel,
          as: 'eventTimings',
          attributes: ['id', 'startDate'],
          where: { startDate: { [Op.lt]: moment().endOf('day').format() } },
          required: true,
          include: {
            model: RegularizeRequestModel,
            as: 'regularizeRequests',
            attributes: ['status'],
          },
        },
      ],
      order: [
        [{ model: EventTimingModel, as: 'eventTimings' }, 'startDate', 'ASC'],
      ],
    });

    attendanceLogs = JSON.parse(JSON.stringify(attendanceLogs));

    if (!attendanceLogs) {
      return null;
    }

    return attendanceLogs;
  } catch (error) {
    eventLogger(`Error from get-event-attendance-logs-service-for-web: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getWebEventAttendanceLogsService;
