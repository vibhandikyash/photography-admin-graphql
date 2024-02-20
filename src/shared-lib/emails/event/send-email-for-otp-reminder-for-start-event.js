
const { Op } = require('sequelize');

const { DEFAULT_TIMEZONE, CANCELLED } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  Event: EventModel, User: UserModel, City: CityModel, EventTiming: EventTimingModel, FreelancerAttendance: FreelancerAttendanceModel,
} = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { OTP_REMINDER_FOR_START_EVENT } = require('../constants/email-template-constants');
const formatEmailDateWithTimeZone = require('../services/format-email-date-with-time-zone');

const sendEmailForOtpReminderForStartEvent = async (currentTime, nextHourOfCurrentTime) => {
  try {
    const freelancerAttendanceData = await FreelancerAttendanceModel.findAll({
      include: [
        {
          model: EventTimingModel,
          as: 'eventTimings',
          where: { startDate: { [Op.gt]: currentTime, [Op.lte]: nextHourOfCurrentTime } },
        },
        {
          model: UserModel,
          as: 'user',
          attributes: ['email', 'fullName'],
        },
        {
          model: EventModel,
          as: 'event',
          attributes: ['name', 'startDate', 'endDate', 'timeZone'],
          where: { status: { [Op.not]: CANCELLED } },
          include: {
            model: CityModel,
            as: 'cities',
            attributes: ['name'],
          },
        },
      ],
    });

    // fetch all freelancer attendance
    freelancerAttendanceData.forEach(freelancerAttendance => {
      try {
        const {
          user: { email: freelancerEmail, fullName: freelancerName } = {},
          event: {
            name: eventName, startDate, endDate, cities: { name: eventLocation } = {}, timeZone = DEFAULT_TIMEZONE,
          } = {},
        } = freelancerAttendance;

        const eventStartDate = formatEmailDateWithTimeZone(startDate, timeZone);
        const eventEndDate = formatEmailDateWithTimeZone(endDate, timeZone);

        // send email to freelancer
        const templateData = {
          templateKey: OTP_REMINDER_FOR_START_EVENT,
          toEmailAddress: freelancerEmail,
          data: {
            freelancerName, eventName, eventStartDate, eventEndDate, eventLocation,
          },
        };
        sendEmail(templateData);
      } catch (error) {
        defaultLogger(`Error from (fetch each freelancer attendance) in sendEmailForOtpReminderForStartEvent : ${error}`, null, 'error');
      }
    });
  } catch (error) {
    defaultLogger(`Error from sendEmailForOtpReminderForStartEvent : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForOtpReminderForStartEvent;
