const BaseError = require('./base-error');
const httpStatusCodes = require('./http-status-codes');

function isOperationalError(error) {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}
class ApiError extends BaseError {
  constructor(
    msgKey,
    statusCode = httpStatusCodes.BAD_REQUEST,
    isOperational = true,
  ) {
    super(msgKey, statusCode, isOperational);
  }
}

module.exports = { ApiError, isOperationalError };
