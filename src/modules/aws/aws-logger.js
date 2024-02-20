const { transports } = require('winston');
const winston = require('winston');

const { defaultLoggerConfig } = require('../../logger');

const loggerInstance = winston.createLogger({
  ...defaultLoggerConfig,
  transports: [
    new transports.Console(),
  ],
  defaultMeta: {
    service: 'aws',
  },
});

const awsLogger = (message, ctx = {}, level = 'info') => {
  loggerInstance.child({
    requestId: ctx?.requestId,
    reqIp: ctx?.reqIp,
    userId: ctx?.userId,
  })[level](message);
};

module.exports = awsLogger;
