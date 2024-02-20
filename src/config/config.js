require('dotenv').config();

const config = {
  ENV: process.env.NODE_ENV,
  HOST: process.env.HOST,
  PORT: process.env.PORT || 3000,
  SENTRY_DSN: process.env.SENTRY_DSN,
  DEPTH_LIMIT_CONFIG: Number(process.env.QUERY_DEPTH_LIMIT) || 5,
  QUERY_LENGTH_LIMIT: Number(process.env.QUERY_LENGTH_LIMIT) || 3500,
  COMPLEXITY_THRESHOLD: Number(process.env.COMPLEXITY_THRESHOLD) || 60,
  QUERY_PAGING_MIN_COUNT: Number(process.env.QUERY_PAGING_MIN_COUNT) || 10,
  QUERY_PAGING_MAX_COUNT: Number(process.env.QUERY_PAGING_MAX_COUNT) || 50,
  API_PREFIX_ROUTE: process.env.API_PREFIX_ROUTE || 'api',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  BYPASS_RATE_LIMIT: process.env.BYPASS_RATE_LIMIT === 'true',
  SALT: process.env.SALT,
  RESET_EXPIRY_TIME: process.env.RESET_EXPIRY_TIME,
  APP_URL: process.env.APP_URL, // FOR ADMIN
  INTERNAL_SERVER_SECRET_KEY: process.env.INTERNAL_SERVER_SECRET_KEY,
  CONTACT_INQUIRY_FORWARDING_EMAIL: process.env.CONTACT_INQUIRY_FORWARDING_EMAIL,
  WEB_URL: process.env.WEB_URL, // FOR WEB
  JWT: {
    SECRET: process.env.JWT_SECRET,
    LIFE_TIME: process.env.JWT_LIFE_TIME,
    REFRESH_TOKEN_LIFE_TIME: process.env.JWT_REFRESH_TOKEN_LIFE_TIME,
  },
  REDIS: {
    HOST: process.env.REDIS_HOST,
    PASSWORD: process.env.REDIS_PASSWORD,
    PORT: process.env.REDIS_PORT,
    TLS: process.env.REDIS_TLS === 'true',
  },
  AWS: {
    ACCESS_ID: process.env.AWS_ACCESS_KEY_ID,
    SECRET_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    BUCKET: {
      PRIVATE_BUCKET_NAME: process.env.AWS_S3_PRIVATE_BUCKET_NAME,
      PUBLIC_BUCKET_NAME: process.env.AWS_S3_PUBLIC_BUCKET_NAME,
    },
    S3_REGION: process.env.AWS_S3_REGION,
    CLOUDFRONT_ID: process.env.CLOUDFRONT_KEY_PAIR_ID,
    CLOUDFRONT_PRIVATE_KEY: process.env.CLOUDFRONT_PRIVATE_KEY,
    CLOUDFRONT_PUBLIC_DOMAIN: process.env.CLOUDFRONT_PUBLIC_DOMAIN,
    CLOUDFRONT_PRIVATE_DOMAIN: process.env.CLOUDFRONT_PRIVATE_DOMAIN,
  },
  SEND_GRID: {
    HOST: process.env.SEND_GRID_HOST,
    PORT: process.env.SEND_GRID_PORT,
    USERNAME: process.env.SEND_GRID_USERNAME,
    PASSWORD: process.env.SEND_GRID_PASSWORD,
    ENCRYPTION: process.env.SEND_GRID_ENCRYPTION,
    FROM_NAME: process.env.SEND_GRID_FROM_NAME,
    FROM_EMAIL: process.env.SEND_GRID_FROM_EMAIL,
  },
  OTP: {
    EXPIRY: process.env.OTP_EXPIRY,
    LENGTH: process.env.OTP_LENGTH,
    TEST_MODE: process.env.OTP_TEST_MODE === 'true',
    TEST_NUMBERS: process.env.OTP_TEST_NUMBERS?.split(',') || [],
    TEST_VALUE: process.env.OTP_TEST_VALUE,
  },
  MSG91: {
    URL: process.env.MSG_91_URL,
    AUTH_KEY: process.env.MSG91_AUTH_KEY,
    SENDER_ID: process.env.MSG91_SENDER_ID,
    TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID,
  },
  ONE_SIGNAL: {
    APP_ID: process.env.ONE_SIGNAL_APP_ID,
    API_KEY: process.env.ONE_SIGNAL_REST_API_KEY,
    URL: process.env.ONE_SIGNAL_URL,
    BATCH_REQUEST_WAIT_TIME_IN_MS: process.env.ONE_SIGNAL_BATCH_REQUEST_WAIT_TIME,
  },
  REPORT_SERVER_URL: process.env.REPORT_SERVER_URL,
};

module.exports = config;
