const { transports } = require('winston');
const winston = require('winston');

const { defaultLoggerConfig } = require('../../../logger');

const regularizationInstance = winston.createLogger({
  ...defaultLoggerConfig,
  defaultMeta: {
    service: 'regularization',
  },
  transports: [new transports.Console()],
});

const regularizationLogger = (message, ctx = {}, level = 'info') => {
  // eslint-disable-next-line security/detect-object-injection
  regularizationInstance.child({
    requestId: ctx?.requestId,
    reqIp: ctx?.reqIp,
    userId: ctx?.userId,
  })[level](message);
};

module.exports = regularizationLogger;
