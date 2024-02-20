const moment = require('moment');

const { DEFAULT_TIMEZONE, EMAIL_DATE_FORMAT } = require('../../../constants/service-constants');

const formatEmailDateWithTimeZone = (time, timeZone = DEFAULT_TIMEZONE) => (
  time ? moment(time).tz(timeZone).format(EMAIL_DATE_FORMAT) : null
);

module.exports = formatEmailDateWithTimeZone;
