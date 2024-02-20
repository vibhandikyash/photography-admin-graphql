/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const defaultLogger = require('../../../../../logger');
const { generatePutS3SignedUrl } = require('../../../../../shared-lib/aws/functions/generate-put-signed-url');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');

const awsFilesUpload = async (req, res, next) => {
  try {
    const result = [];
    if (req.body.length) {
      for (const data of req.body) {
        const { key, contentType } = data;
        if (!contentType || !key) throw new ApiError('INVALID_INPUT', 400);
        const fileKey = key.trim().replace(/ /g, '_');
        const response = await generatePutS3SignedUrl(fileKey, contentType);
        result.push(response);
      }
    }

    return sendSuccessResponse(res, 'SIGNED_URL_SUCCESS', 200, result);
  } catch (error) {
    defaultLogger(`Error while awsFilesUpload  ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = awsFilesUpload;
