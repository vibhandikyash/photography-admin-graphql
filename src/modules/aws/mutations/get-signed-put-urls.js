/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable consistent-return */

const { publicBucket } = require('../../../constants/service-constants');
const { generatePutS3SignedUrl } = require('../../../shared-lib/aws/functions/generate-put-signed-url');
const awsLogger = require('../aws-logger');

const getSignedPutUrls = async (_, args, ctx) => {
  try {
    const signedUrls = [];
    const keys = [];
    const result = {
      signedUrls,
      keys,
    };
    for (const data of args.data) {
      const { key, contentType, acl } = data;
      const fileKey = key.trim().replace(/ /g, '_');
      const response = acl && acl === 'public-read' ? await generatePutS3SignedUrl(fileKey, contentType, ctx, publicBucket)
        : await generatePutS3SignedUrl(fileKey, contentType, ctx);
      signedUrls.push(response.signedUrl);
      keys.push(response.key);
    }
    return result;
  } catch (error) {
    awsLogger(`Error while get signed put urls:${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getSignedPutUrls;
