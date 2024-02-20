const CONFIG = require('../../../config/config');
const { logger } = require('../../../logger');
const { S3: awsS3 } = require('../index');

const generatePutS3SignedUrl = async (key, contentType, ctx, publicBucket) => {
  const params = {
    Bucket: publicBucket ? CONFIG.AWS.BUCKET.PUBLIC_BUCKET_NAME : CONFIG.AWS.BUCKET.PRIVATE_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Expires: 3600,
    ACL: publicBucket ? 'public-read' : 'private',
  };

  return new Promise((resolve, reject) => {
    awsS3.getSignedUrl('putObject', params, (error, url) => {
      if (error) {
        logger.error(`${key} generate signed url failed`, ctx, 'error');
        reject(error);
      } else {
        // logger.info(`${key} signed url generated`, ctx);
        resolve({
          signedUrl: url,
          key,
        });
      }
    });
  });
};

module.exports = {
  generatePutS3SignedUrl,
};
