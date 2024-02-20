const { transports } = require('winston');
const winston = require('winston');

const { defaultLoggerConfig } = require('../../../logger');

const ChatInstance = winston.createLogger({
  ...defaultLoggerConfig,
  defaultMeta: {
    service: 'chat',
  },
  transports: [new transports.Console()],
});

const chatLogger = (message, ctx = {}, level = 'info') => {
  // eslint-disable-next-line security/detect-object-injection
  ChatInstance.child({
    requestId: ctx?.requestId,
    reqIp: ctx?.reqIp,
    userId: ctx?.user?.id,
  })[level](message);
};

module.exports = chatLogger;
