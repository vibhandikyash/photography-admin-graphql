const { transports } = require('winston');
const winston = require('winston');

const { defaultLoggerConfig } = require('../../logger');

const loggerInstance = winston.createLogger({
  ...defaultLoggerConfig,
  defaultMeta: {
    service: 'event',
  },
  transports: [new transports.Console()],
});

const eventLogger = (message, ctx = {}, level = 'info') => {
  // eslint-disable-next-line security/detect-object-injection
  loggerInstance.child({
    requestId: ctx?.requestId,
    reqIp: ctx?.reqIp,
    userId: ctx?.userId,
  })[level](message);
};

module.exports = eventLogger;
