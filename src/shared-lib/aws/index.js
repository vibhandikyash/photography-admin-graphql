const AWS = require('aws-sdk');

const CONFIG = require('../../config/config');

AWS.config.update({
  accessKeyId: CONFIG.AWS.ACCESS_ID,
  secretAccessKey: CONFIG.AWS.SECRET_KEY,
  signatureVersion: 'v4',
  region: CONFIG.AWS.S3_REGION,
});

const S3 = new AWS.S3();

module.exports = { S3, AWS };
