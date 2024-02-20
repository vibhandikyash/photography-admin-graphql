const { CustomApolloError } = require('./custom-apollo-error');
const { CustomAuthenticationError } = require('./custom-authentication-error');
const { CustomForbiddenError } = require('./custom-forbidden-error');

module.exports = {
  CustomApolloError,
  CustomAuthenticationError,
  CustomForbiddenError,
};
