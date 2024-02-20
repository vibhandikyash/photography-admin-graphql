const { createRateLimitDirective, InMemoryStore, RedisStore } = require('graphql-rate-limit');

const CONFIG = require('../config/config');
const { redisClient } = require('../redis-client');
const { getMessage } = require('../utils/messages');

let rateLimitStore = new InMemoryStore();

if (CONFIG.REDIS.HOST) {
  rateLimitStore = new RedisStore(redisClient);
}

const rateLimitConfig = {
  identifyContext: ctx => ctx.reqIp, // TODO: change identifyContext according to your usage
  formatError: () => getMessage('RATE_LIMIT'),
  store: rateLimitStore,
};

const rateLimitDirective = createRateLimitDirective(rateLimitConfig);

module.exports = rateLimitDirective;
