const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');
const invoiceLogger = require('../invoice-logger');

const invoiceKeyFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { key } = parent;
    const [imageUrl] = await getKeysAndGenerateUrl([key]);
    return imageUrl;
  } catch (error) {
    invoiceLogger(`Error in invoiceKeyFieldResolver: ${error}`, ctx);
    throw error;
  }
};

module.exports = invoiceKeyFieldResolver;
