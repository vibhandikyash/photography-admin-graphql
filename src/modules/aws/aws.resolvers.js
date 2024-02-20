const getImagesSignedUrls = require('./mutations/get-images-signed-urls');
const getSignedPutUrl = require('./mutations/get-signed-put-url');
const getSignedPutUrls = require('./mutations/get-signed-put-urls');

const resolvers = {
  Mutation: {
    getSignedPutUrl,
    getSignedPutUrls,
    getImagesSignedUrls,
  },
};

module.exports = resolvers;
