const { ForbiddenError } = require('apollo-server-express');

class CustomForbiddenError extends ForbiddenError {
  constructor(message, code = 'CUSTOM_FORBIDDEN_ERROR') {
    super(message, code);
  }
}

module.exports = { CustomForbiddenError };
