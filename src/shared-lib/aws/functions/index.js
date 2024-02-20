const copyFile = require('./copy-file');
const deleteFile = require('./delete-file');
const { generateGetCloudFrontSignedUrl, generateS3PublicUrl, generateGetS3SignedUrl } = require('./generate-get-signed-url');
const { generatePutS3SignedUrl } = require('./generate-put-signed-url');

module.exports = {
  copyFile,
  deleteFile,
  generateGetCloudFrontSignedUrl,
  generateGetS3SignedUrl,
  generateS3PublicUrl,
  generatePutS3SignedUrl,
};
