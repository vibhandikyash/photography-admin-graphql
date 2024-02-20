/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.changeColumn('user_businesses', 'city', {
      type: 'uuid USING CAST("city" as uuid)',
    }),
    queryInterface.changeColumn('user_businesses', 'state', {
      type: 'uuid USING CAST("state" as uuid)',
    }),
    queryInterface.changeColumn('user_businesses', 'country', {
      type: 'uuid USING CAST("country" as uuid)',
    }),
  ]),
};
