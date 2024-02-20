/* eslint-disable max-len */

// eslint-disable-next-line filenames-simple/naming-convention
module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.sequelize.query('ALTER TABLE public.user_collection_assets ALTER COLUMN collection_id DROP NOT NULL'),
  ]),

  down: async queryInterface => Promise.all([
    queryInterface.sequelize.query('ALTER TABLE public.user_collection_assets ALTER COLUMN collection_id SET NOT NULL'),
  ]),
};
