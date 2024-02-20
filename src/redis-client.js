const Redis = require('ioredis');

const { REDIS } = require('./config/config');
const defaultLogger = require('./logger');

const redisOptions = {
  host: REDIS.HOST,
  port: REDIS.PORT,
  password: REDIS.PASSWORD,
};

if (REDIS.TLS) {
  redisOptions.tls = {};
}

const redisClient = new Redis(redisOptions);

const purgeCacheByKey = (pattern, ctx) => new Promise((resolve, reject) => {
  const stream = redisClient.scanStream({
    match: `${pattern}*`,
  });
  stream.on('data', keys => {
    if (keys.length) {
      const pipeline = redisClient.pipeline();
      keys.forEach(key => {
        pipeline.del(key);
      });
      pipeline.exec();
    }
  });
  stream.on('end', () => {
    defaultLogger(`Purged all cache keys for pattern ${pattern}`, ctx);
    return resolve();
  });
  stream.on('error', exec => {
    defaultLogger(`error purging all keys for pattern ${pattern} : ${exec}`, ctx, 'error');
    return reject(exec);
  });
});

const getCachedData = async key => {
  try {
    const cachedPerson = await redisClient.get(key);
    if (cachedPerson) {
      const cachedPersonData = JSON.parse(cachedPerson);
      defaultLogger(`REDIS_CACHE_HIT > ${key}`, null, 'debug');
      return cachedPersonData;
    }
    return null;
  } catch (error) {
    defaultLogger(`Error getting cached data for key ${key} : ${error}`, null, 'error');
    return null;
  }
};

const setCacheData = async (key, data = {}, expiry = 3600) => {
  try {
    const payload = JSON.stringify(data);
    await redisClient.setex(key, expiry, payload);
    defaultLogger(`REDIS_CACHE_WRITE > ${key}`, null, 'debug');
    return null;
  } catch (error) {
    defaultLogger(`Error writing cach for key ${key}  : ${error}`, null, 'error');
    return null;
  }
};

module.exports = {
  redisClient, purgeCacheByKey, getCachedData, setCacheData,
};
