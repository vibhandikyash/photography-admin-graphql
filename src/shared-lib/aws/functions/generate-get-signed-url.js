/* eslint-disable default-param-last */
/* eslint-disable max-len */

const AWS = require('aws-sdk');

const CONFIG = require('../../../config/config');
const { logger } = require('../../../logger');
const { setCacheData, getCachedData } = require('../../../redis-client');
const { S3: awsS3 } = require('../index');

const generateGetS3SignedUrl = async (key, ctx) => {
  const params = {
    Bucket: CONFIG.AWS.BUCKET.PRIVATE_BUCKET_NAME,
    Key: key,
    Expires: 3600,
  };
  return new Promise((resolve, reject) => {
    awsS3.getSignedUrl('getObject', params, (error, url) => {
      if (error) {
        logger.error(`${key} generate signed url failed`, ctx, 'error');
        reject(error);
      } else {
        // logger.info(`${key} signed url generated`, ctx);
        resolve({
          signedUrl: url,
        });
      }
    });
  });
};

// eslint-disable-next-line consistent-return
const generateS3PublicUrl = async (key, bucketName = CONFIG.AWS.BUCKET.PRIVATE_BUCKET_NAME, isThumbnail, ctx) => {
  if (!key) {
    logger.error('key not found', ctx, 'error');
  } else {
    const url = isThumbnail ? `https://${bucketName}.s3.${CONFIG.AWS.S3_REGION}.amazonaws.com/thumbnails/${key}`
      : `https://${bucketName}.s3.${CONFIG.AWS.S3_REGION}.amazonaws.com/${key}`;

    // logger.info(`${key} signed url generated`, ctx);
    return url;
  }
};

const generateGetCloudFrontSignedUrl = async (awsFileKey, isThumbnail, expiresInSeconds = 20 * 60, ctx) => {
  try {
    const awsFinalFileKey = isThumbnail ? `${'thumbnails'}/${awsFileKey}` : `${awsFileKey}`;
    let signedUrl = await getCachedData(awsFinalFileKey);
    if (!signedUrl) {
      const cloudfrontSigner = new AWS.CloudFront.Signer(CONFIG.AWS.CLOUDFRONT_ID, CONFIG.AWS.CLOUDFRONT_PRIVATE_KEY);
      const currentDate = Date.now();
      const signedUrlExpiry = expiresInSeconds * 1000; // 1 day
      const redisKeyExpiry = expiresInSeconds - 300; // redis expiry 300 sec less

      signedUrl = cloudfrontSigner.getSignedUrl({
        url: `${CONFIG.AWS.CLOUDFRONT_PRIVATE_DOMAIN}${awsFinalFileKey}`,
        expires: Math.floor((currentDate + signedUrlExpiry) / 1000),
      });

      setCacheData(awsFinalFileKey, signedUrl, redisKeyExpiry);
    }
    return signedUrl;
  } catch (error) {
    logger.error(`Error From generateGetCloudFrontSignedUrl ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = {
  generateGetS3SignedUrl,
  generateGetCloudFrontSignedUrl,
  generateS3PublicUrl,
};
