const { getMessage } = require('./messages');

/**
 * Crete new error object
 * @param {string} msgKey
 * @param {int} statusCode
 * @returns
 */
const createError = async (res, msgKey = 'INTERNAL_SERVER_ERROR', statusCode = 400) => {
  const message = getMessage(msgKey);
  return {
    message,
    statusCode,
  };
};

/**
 * Send success response
 * @param {} res
 * @param {string} msgKey
 * @param {int} status
 * @param {*} data
 */
const sendSuccess = (res, msgKey = 'SUCCESS', status = 200, data = {}) => {
  const message = getMessage(msgKey);

  res.status(status).json({
    success: true,
    statusCode: status,
    message,
    data,
  });
};

/**
 * Send error response
 * @param {} res
 * @param {string} msgKey
 * @param {int} status
 * @param {*} error
 */
const sendError = (res, msgKey = 'INTERNAL_SERVER_ERROR', status = 500) => {
  const message = getMessage(msgKey);

  res.status(status).json({
    success: false,
    statusCode: status,
    message,
  });
};

/**
 * Get the only first error message from the validator's errors array
 * @param {*} error
 * @returns string
 */
const getValidatorFirstMsg = async error => error.array()[0].msg;

module.exports = {
  sendSuccessResponse: sendSuccess,
  sendErrorResponse: sendError,
  createError,
  getValidatorFirstMsg,
};
