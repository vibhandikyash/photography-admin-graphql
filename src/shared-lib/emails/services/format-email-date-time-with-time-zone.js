const moment = require('moment');

const { DEFAULT_TIMEZONE, EMAIL_DATE_TIME_FORMAT } = require('../../../constants/service-constants');

const formatEmailDateTimeWithTimeZone = (time, timeZone = DEFAULT_TIMEZONE) => (
  time ? moment(time).tz(timeZone).format(EMAIL_DATE_TIME_FORMAT) : null
);

module.exports = formatEmailDateTimeWithTimeZone;
