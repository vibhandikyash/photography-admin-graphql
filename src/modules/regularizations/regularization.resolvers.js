const createRegularizeWebRequest = require('./mutations/create-regularize-web-request');
const updateInsufficientRequestStatus = require('./mutations/update-insufficient-hours-status');
const updateRegularizeRequestStatus = require('./mutations/update-regularize-request-status');
const regularizeRequestCount = require('./queries/regularize-request-count');
const regularizeRequestDetails = require('./queries/regularize-request-details');
const regularizeRequests = require('./queries/regularize-requests');
const regularizationFieldResolvers = require('./regularization-field-resolvers/regularization-field-resolvers');

const resolvers = {
  ...regularizationFieldResolvers,
  Mutation: {
    updateRegularizeRequestStatus,
    updateInsufficientRequestStatus,
    createRegularizeWebRequest,
  },
  Query: {
    regularizeRequests,
    regularizeRequestCount,
    regularizeRequestDetails,
  },
};

module.exports = resolvers;
