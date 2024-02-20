const { makeExecutableSchema } = require('@graphql-tools/schema');
const Sentry = require('@sentry/node');
const { ApolloServerPluginLandingPageGraphQLPlayground, ApolloServerPluginLandingPageDisabled } = require('apollo-server-core');
const { ApolloServer, AuthenticationError } = require('apollo-server-express');

const packageJson = require('../package.json');

const CONFIG = require('./config/config');
const { directiveResolvers } = require('./directives/auth-directive');
const rateLimitDirective = require('./directives/rate-limit');
const { logger } = require('./logger');
const { resolvers, typeDefs } = require('./modules');
const sequelizeClient = require('./sequelize-client');
const { models } = require('./sequelize-client');
const depthLimitRule = require('./shared-lib/depth-limit-rule');
const { CustomApolloError, CustomAuthenticationError, CustomForbiddenError } = require('./shared-lib/error-handler');
const queryComplexityPlugin = require('./shared-lib/query-complexity-plugin');
const sentryLogsPlugin = require('./shared-lib/sentry-logs-plugin');
const addRequestMetaToCtx = require('./utils/auth/add-request-meta-to-ctx');
const getUser = require('./utils/auth/get-user');
const addLocaleServiceToCtx = require('./utils/intl/add-locale-service-to-ctx');
const i18n = require('./utils/intl/i18n-config');
const LocaleService = require('./utils/intl/locale-service');
const { getMessage } = require('./utils/messages');

const schemaDirectives = {};

if (!CONFIG.BYPASS_RATE_LIMIT) {
  schemaDirectives.rateLimit = rateLimitDirective;
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  directiveResolvers,
  schemaDirectives,
});

Sentry.init({
  dsn: CONFIG.SENTRY_DSN,
  environment: CONFIG.ENV || 'development',
  release: packageJson.version,
});

const INTROSPECTION_ALLOWED_ENVIRONMENTS = ['localhost', 'dev', 'development', 'staging'];

async function startApolloServer(app) {
  try {
    const localeService = new LocaleService(i18n);

    const server = new ApolloServer({
      schema,
      introspection: INTROSPECTION_ALLOWED_ENVIRONMENTS.includes(CONFIG.ENV),
      playground: INTROSPECTION_ALLOWED_ENVIRONMENTS.includes(CONFIG.ENV),
      plugins: [
        queryComplexityPlugin(schema),
        sentryLogsPlugin(Sentry),
        INTROSPECTION_ALLOWED_ENVIRONMENTS.includes(CONFIG.ENV)
          ? ApolloServerPluginLandingPageGraphQLPlayground()
          : ApolloServerPluginLandingPageDisabled(),
      ],
      formatError: error => {
        let message = error.message.replace('SequelizeValidationError: ', '').replace('Validation error: ', '');

        if (error.extensions.code === 'GRAPHQL_VALIDATION_FAILED') {
          return { ...error, message };
        }
        if (!(error.originalError instanceof CustomAuthenticationError
          || error.originalError instanceof CustomApolloError
          || error.originalError instanceof CustomForbiddenError)) {
          if (error.message === getMessage('RATE_LIMIT')) {
            message = error.message;
            return { message };
          }
          message = getMessage('INTERNAL_SERVER_ERROR'); // FOR SERVER ERRORS
          return { message };
        }

        return { ...error, message };
      },
      context: async ctx => {
        if (ctx.connection) {
          return { connection: ctx.connection };
        }
        addLocaleServiceToCtx(ctx, localeService);
        addRequestMetaToCtx(ctx);
        return {
          ...ctx,
          req: ctx.req,
          res: ctx.res,
          models: sequelizeClient.models,
        };
      },
      subscriptions: {
        path: `/${CONFIG.API_PREFIX_ROUTE}/graphql`,
        onConnect: connectionParams => {
          if (CONFIG.ENV === 'development') {
            logger.info('------------onConnect---------------');
          }
          if (connectionParams && connectionParams.authorization) {
            return getUser(connectionParams.authorization, models)
              .then(user => ({ user })).catch(() => { throw new AuthenticationError('Not Authorized!'); });
          }
          throw new Error('Missing auth token!');
        },
      },
      validationRules: [depthLimitRule(CONFIG.DEPTH_LIMIT_CONFIG)],
    });

    await server.start();
    server.applyMiddleware({ app, path: `/${CONFIG.API_PREFIX_ROUTE}/graphql` });
  } catch (error) {
    logger.error(`ERROR STARTING APOLLO SERVER >> ${error}`);
    throw error;
  }
}

module.exports = startApolloServer;
