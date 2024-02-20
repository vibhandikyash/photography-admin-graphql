const moment = require('moment');

const {
  DEFAULT_TIMEZONE, REGULARIZE_REQUEST_VALIDATION_HOURS,
  REGULARIZE_REQUEST_VALIDATION_END_TIME,
} = require('../../../constants/service-constants');
const regularizationLogger = require('../regularization-logger');

const checkExtraHoursCriteria = (eventTimeZone = DEFAULT_TIMEZONE, startDate, endDate, ctx) => {
  try {
    const localStartedAt = moment(startDate).tz(eventTimeZone).format();
    const localEndedAt = moment(endDate).tz(eventTimeZone).format();
    const localStartedAtNextDay = moment(localStartedAt).tz(eventTimeZone).add(1, 'days');

    const hoursDiff = moment(endDate).diff(startDate, 'hours');
    const endTime = moment(localEndedAt).tz(eventTimeZone).format('HH');
    const isSameEndDate = moment(localStartedAtNextDay).isSame(localEndedAt, 'day');

    if (hoursDiff > REGULARIZE_REQUEST_VALIDATION_HOURS && isSameEndDate && endTime > REGULARIZE_REQUEST_VALIDATION_END_TIME) {
      return true;
    }
    return false;
  } catch (error) {
    regularizationLogger(`Error while checking extra hours criteria, ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = checkExtraHoursCriteria;
