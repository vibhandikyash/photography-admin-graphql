const CONFIG = require('../../../config/config');
const logger = require('../../../logger');
const { S3: awsS3 } = require('../index');

const copyFile = async (source, destination, ctx) => {
  const params = {
    Bucket: CONFIG.AWS.BUCKET.PRIVATE_BUCKET_NAME,
    CopySource: source,
    Key: destination,
  };
  return new Promise((resolve, reject) => {
    awsS3.copyObject(params, (error, copyData) => {
      if (error) {
        logger(`Error while copying file from AWS > ${source} to ${destination}`, ctx, 'error');
        reject(error);
      } else {
        logger(`${source} file copied to ${destination}`, ctx);
        resolve(copyData);
      }
    });
  });
};

module.exports = copyFile;
