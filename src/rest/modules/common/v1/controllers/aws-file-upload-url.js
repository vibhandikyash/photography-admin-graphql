const defaultLogger = require('../../../../../logger');
const { generatePutS3SignedUrl } = require('../../../../../shared-lib/aws/functions/generate-put-signed-url');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');

const awsFileUpload = async (req, res, next) => {
  try {
    // Single file upload
    const { key, contentType } = req.body;
    if (!contentType || !key) throw new ApiError('INVALID_INPUT', 400);
    const signedUrlResponse = await generatePutS3SignedUrl(key, contentType, null);

    return sendSuccessResponse(res, 'SIGNED_URL_SUCCESS', 200, signedUrlResponse);
  } catch (error) {
    defaultLogger(`Error while awsFileUpload  ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = awsFileUpload;
