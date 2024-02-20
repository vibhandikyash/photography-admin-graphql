const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');
const freelancerLogger = require('../freelancer-logger');

const freelancerProfileFieldResolver = async (parent, args, ctx = {}, info) => {
  try {
    const { fieldName } = info;
    const [imageUrl] = await getKeysAndGenerateUrl([parent[fieldName]]);
    return imageUrl;
  } catch (err) {
    freelancerLogger(`Error in freelancerProfileFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = freelancerProfileFieldResolver;
