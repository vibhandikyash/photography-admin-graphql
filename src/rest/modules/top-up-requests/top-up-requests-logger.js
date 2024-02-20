const { transports } = require('winston');
const winston = require('winston');

const { defaultLoggerConfig } = require('../../../logger');

const topUpRequestsInstance = winston.createLogger({
  ...defaultLoggerConfig,
  defaultMeta: {
    service: 'event',
  },
  transports: [new transports.Console()],
});

const topUpRequestsLogger = (message, ctx = {}, level = 'info') => {
  // eslint-disable-next-line security/detect-object-injection
  topUpRequestsInstance.child({
    requestId: ctx?.requestId,
    reqIp: ctx?.reqIp,
    userId: ctx?.user?.id,
  })[level](message);
};

module.exports = topUpRequestsLogger;
