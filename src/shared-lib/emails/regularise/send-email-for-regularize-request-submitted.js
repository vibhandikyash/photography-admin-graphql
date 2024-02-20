
const { DEFAULT_TIMEZONE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  RegularizeRequest: RegularizeRequestModel, User: UserModel, Event: EventModel,
  EventTiming: EventTimingModel, FreelancerAttendance: FreelancerAttendanceModel,
} = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { REGULARIZE_REQUEST_SUBMITTED } = require('../constants/email-template-constants');
const formatEmailDateTimeWithTimeZone = require('../services/format-email-date-time-with-time-zone');

const sendEmailForRegularizeRequestSubmitted = async regularizeRequestId => {
  try {
    const regularizeRequest = await RegularizeRequestModel.findByPk(regularizeRequestId, {
      attributes: ['startedAt', 'endedAt'],
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'email', 'fullName'],
        }, {
          model: EventModel,
          as: 'event',
          attributes: ['name', 'timeZone'],
        }, {
          model: EventTimingModel,
          as: 'eventTiming',
          attributes: ['id'],
        }],
    });

    const {
      startedAt: requestedStartTime, endedAt: requestedEndTime,
      user: { id: userId, email: freelancerEmail, fullName: freelancerName },
      event: { name: eventName, timeZone = DEFAULT_TIMEZONE }, eventTiming: { id: eventTimingsId },
    } = regularizeRequest;

    const freelancerAttendance = await FreelancerAttendanceModel.findOne({
      where: { eventTimingsId, userId },
      attributes: ['firstClockIn', 'lastClockOut'],
    });

    const { firstClockIn: actualStartTime, lastClockOut: actualEndTime } = freelancerAttendance;

    const templateData = {
      templateKey: REGULARIZE_REQUEST_SUBMITTED,
      toEmailAddress: freelancerEmail,
      data: {
        freelancerName,
        eventName,
        actualStartTime: formatEmailDateTimeWithTimeZone(actualStartTime, timeZone),
        actualEndTime: formatEmailDateTimeWithTimeZone(actualEndTime, timeZone),
        requestedStartTime: formatEmailDateTimeWithTimeZone(requestedStartTime, timeZone),
        requestedEndTime: formatEmailDateTimeWithTimeZone(requestedEndTime, timeZone),
      },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForRegularizeRequestSubmitted : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForRegularizeRequestSubmitted;
