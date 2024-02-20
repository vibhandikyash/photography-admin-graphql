const { AuthenticationError } = require('apollo-server-express');

class CustomAuthenticationError extends AuthenticationError {
  constructor(message, code = 'UNAUTHENTICATED') {
    super(message, code);
  }
}

module.exports = { CustomAuthenticationError };
