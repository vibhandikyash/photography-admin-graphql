const { transports } = require('winston');
const winston = require('winston');

const { defaultLoggerConfig } = require('../../../logger');

const recruiterInstance = winston.createLogger({
  ...defaultLoggerConfig,
  defaultMeta: {
    service: 'recruiter',
  },
  transports: [new transports.Console()],
});

const recruitersLogger = (message, ctx = {}, level = 'info') => {
  // eslint-disable-next-line security/detect-object-injection
  recruiterInstance.child({
    requestId: ctx?.requestId,
    reqIp: ctx?.reqIp,
    userId: ctx?.userId,
  })[level](message);
};

module.exports = recruitersLogger;
