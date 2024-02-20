const CONFIG = require('../../../config/config');
const logger = require('../../../logger');
const { S3: awsS3 } = require('../index');

const deleteFile = async (filePath, ctx) => {
  const params = {
    Bucket: CONFIG.AWS.BUCKET.PRIVATE_BUCKET_NAME,
    Key: filePath,
  };
  return new Promise((resolve, reject) => {
    awsS3.deleteObject(params, (error, deleteData) => {
      if (error) {
        logger(`Error while deleting file from AWS > ${filePath}`, ctx, 'error');
        reject(error.message);
      } else {
        logger(`${filePath} file deleted`, ctx);
        resolve(deleteData);
      }
    });
  });
};

module.exports = deleteFile;
