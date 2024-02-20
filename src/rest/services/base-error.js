class BaseError {
  constructor(msgKey, statusCode = 500, isOperational = true) {
    this.success = false;
    this.statusCode = statusCode;
    this.message = msgKey;
    this.isOperational = isOperational;
  }
}

module.exports = BaseError;
