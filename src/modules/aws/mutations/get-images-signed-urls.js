const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');
const awsLogger = require('../aws-logger');

const getImagesSignedUrls = async (_, args, ctx) => {
  try {
    const { data: { keys } } = args;
    const images = await getKeysAndGenerateUrl(keys, false, 20 * 60);
    return images;
  } catch (error) {
    awsLogger(`Error while getting image  >> ${error.message}`, ctx, 'error');
    throw error;
  }
};

module.exports = getImagesSignedUrls;
