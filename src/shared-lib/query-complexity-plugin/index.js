const { separateOperations } = require('graphql');
const { getComplexity, simpleEstimator } = require('graphql-query-complexity');

const CONFIG = require('../../config/config');
const { logger } = require('../../logger');
const { CustomApolloError } = require('../error-handler');

const queryComplexityPlugin = schema => ({
  requestDidStart: () => ({
    didResolveOperation({ request, document }) {
      try {
        const complexity = getComplexity({
          schema,
          query: request.operationName
            ? separateOperations(document)[request.operationName]
            : document,
          variables: request.variables,
          estimators: [
            simpleEstimator({
              defaultComplexity: 1,
            }),
          ],
        });
        const { COMPLEXITY_THRESHOLD } = CONFIG;
        if (complexity >= COMPLEXITY_THRESHOLD) {
          logger.info(`EXCEEDED_QUERY_COMPLEXITY : ${complexity}`);
          throw new CustomApolloError('INVALID REQUEST');
        }
      } catch (error) {
        throw new CustomApolloError(error?.message, 'GRAPHQL_VALIDATION_FAILED');
      }
    },
  }),
});

module.exports = queryComplexityPlugin;
