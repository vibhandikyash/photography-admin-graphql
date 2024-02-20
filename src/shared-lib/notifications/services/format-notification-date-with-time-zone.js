const moment = require('moment');

const { DEFAULT_TIMEZONE, NOTIFICATION_DATE_FORMAT } = require('../../../constants/service-constants');

const formatNotificationDateWithTimeZone = (time, timeZone = DEFAULT_TIMEZONE) => (
  time ? moment(time).tz(timeZone).format(NOTIFICATION_DATE_FORMAT) : null
);

module.exports = formatNotificationDateWithTimeZone;
