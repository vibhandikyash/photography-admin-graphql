const logClientNameMiddleware = require('./log-client-name');
const logIpMiddleware = require('./log-ip');
const logRequestId = require('./log-request-id');
const logUserId = require('./log-user-id');

module.exports = [
  logClientNameMiddleware,
  logIpMiddleware,
  logRequestId,
  logUserId,
];
