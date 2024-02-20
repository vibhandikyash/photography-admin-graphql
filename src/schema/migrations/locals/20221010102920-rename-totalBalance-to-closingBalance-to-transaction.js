/* eslint-disable filenames-simple/naming-convention */
module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.renameColumn('transaction', 'total_balance', 'closing_balance'),
  ]),
};
