const { transports } = require('winston');
const winston = require('winston');

const { defaultLoggerConfig } = require('../../logger');

const recruiterLoggerInstance = winston.createLogger({
  ...defaultLoggerConfig,
  defaultMeta: {
    service: 'recruiter',
  },
  transports: [new transports.Console()],
});

const recruiterLogger = (message, ctx = {}, level = 'info') => {
  // eslint-disable-next-line security/detect-object-injection
  recruiterLoggerInstance.child({
    requestId: ctx?.requestId,
    reqIp: ctx?.reqIp,
    userId: ctx?.userId,
  })[level](message);
};

module.exports = recruiterLogger;
