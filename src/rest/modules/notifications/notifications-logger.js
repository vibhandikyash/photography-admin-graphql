const { transports } = require('winston');
const winston = require('winston');

const { defaultLoggerConfig } = require('../../../logger');

const notificationInstance = winston.createLogger({
  ...defaultLoggerConfig,
  defaultMeta: {
    service: 'notification',
  },
  transports: [new transports.Console()],
});

const notificationLogger = (message, ctx = {}, level = 'info') => {
  // eslint-disable-next-line security/detect-object-injection
  notificationInstance.child({
    requestId: ctx?.requestId,
    reqIp: ctx?.reqIp,
    userId: ctx?.userId,
  })[level](message);
};

module.exports = notificationLogger;
