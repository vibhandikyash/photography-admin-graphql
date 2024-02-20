const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');
const recruiterLogger = require('../recruiter-logger');

const recruiterProfileFieldResolver = async (parent, args, ctx = {}, info) => {
  try {
    const { fieldName } = info;
    const [imageUrl] = await getKeysAndGenerateUrl([parent[fieldName]]);
    return imageUrl;
  } catch (err) {
    recruiterLogger(`Error in recruiterProfileFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = recruiterProfileFieldResolver;
