/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */

const { isEmpty } = require('lodash');

const { generateGetCloudFrontSignedUrl } = require('./generate-get-signed-url');

const getKeysAndGenerateUrl = async (keys, isThumbnail = false, expiriesInSeconds = 20 * 60) => {
  const keysUrl = [];
  if (keys?.length) {
    for (const key of keys) {
      if (!isEmpty(key)) {
        const url = await generateGetCloudFrontSignedUrl(key, isThumbnail, expiriesInSeconds);
        keysUrl.push(url);
      }
    }
  }
  return keysUrl;
};

module.exports = {
  getKeysAndGenerateUrl,
};
