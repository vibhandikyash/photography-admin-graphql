/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.removeConstraint('user_collection_assets', 'user_collection_assets_url_key'),
  ]),
};
