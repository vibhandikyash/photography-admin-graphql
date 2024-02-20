const { ApolloError } = require('apollo-server-express');

class CustomApolloError extends ApolloError {
  constructor(message, code = 'CUSTOM_APOLLO_ERROR') {
    super(message, code);
  }
}

module.exports = { CustomApolloError };
