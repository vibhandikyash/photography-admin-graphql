/* eslint-disable max-len */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
const { CustomApolloError, CustomAuthenticationError, CustomForbiddenError } = require('../error-handler');

const SentryLogsPlugin = Sentry => ({
  requestDidStart() {
    return {
      didEncounterErrors(ctx) {
        // If we couldn't parse the operation (usually invalid queries)
        if (!ctx.operation) {
          return;
        }

        for (const error of ctx.errors) {
          if (error.originalError instanceof CustomApolloError || error.originalError instanceof CustomAuthenticationError || error.originalError instanceof CustomForbiddenError) {
            continue;
          }
          Sentry.captureException(error);
        }
      },
    };
  },
});

module.exports = SentryLogsPlugin;
