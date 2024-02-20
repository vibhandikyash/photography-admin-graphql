const { AWS: { BUCKET: { PRIVATE_BUCKET_NAME } } } = require('../../../config/config');
const defaultLogger = require('../../../logger');
const { S3 } = require('../index');

const getObject = async (bucketName = PRIVATE_BUCKET_NAME, key) => {
  try {
    const response = await S3.getObject({ Bucket: bucketName, Key: key }).promise();
    return response;
  } catch (error) {
    defaultLogger(`Error From get S3Object => ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getObject;
