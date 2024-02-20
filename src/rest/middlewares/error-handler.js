const { sendErrorResponse } = require('../../utils/create-error');
const { isOperationalError } = require('../services/custom-api-error');

/* eslint-disable no-unused-vars */
function restErrorHandler(err, req, res, next) {
  if (isOperationalError(err)) {
    return sendErrorResponse(res, err.message, err.statusCode);
  }
  return sendErrorResponse(res, 'INTERNAL_SERVER_ERROR');
}

module.exports = { restErrorHandler, isOperationalError };
