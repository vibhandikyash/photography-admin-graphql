/* eslint-disable consistent-return */

const { publicBucket } = require('../../../constants/service-constants');
const { generatePutS3SignedUrl } = require('../../../shared-lib/aws/functions/generate-put-signed-url');
const awsLogger = require('../aws-logger');

const getSignedPutUrl = async (_, args, ctx) => {
  try {
    const { data: { key, contentType, acl } } = args;
    const fileKey = key.trim().replace(/ /g, '_');
    return acl && acl === 'public-read' ? await generatePutS3SignedUrl(fileKey, contentType, ctx, publicBucket)
      : await generatePutS3SignedUrl(fileKey, contentType, ctx);
  } catch (error) {
    awsLogger(`Error while get signed put url:${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getSignedPutUrl;
