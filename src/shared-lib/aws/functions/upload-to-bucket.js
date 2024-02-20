const { AWS: { BUCKET: { PRIVATE_BUCKET_NAME } } } = require('../../../config/config');
const defaultLogger = require('../../../logger');
const { S3: awsS3 } = require('../index');

const uploadToBucket = async (key, content, contentType, bucketName = PRIVATE_BUCKET_NAME) => {
  try {
    const params = {
      Bucket: bucketName, Key: key, Body: content, ContentType: contentType,
    };

    await awsS3.upload(params).promise();
  } catch (error) {
    defaultLogger(`Error From uploadS3File => ${error}`, null, 'error');
    throw error;
  }
};

module.exports = uploadToBucket;
