/* eslint-disable filenames-simple/naming-convention */
/* eslint-disable quotes */
/* eslint-disable max-len */

// eslint-disable-next-line filenames-simple/naming-convention

module.exports = {
  up: async queryInterface => Promise.all([
    queryInterface.sequelize.query("ALTER TYPE enum_transaction_transaction_type ADD VALUE 'CONVENIENCE_FEES'"),
    queryInterface.sequelize.query("ALTER TYPE enum_transaction_transaction_type ADD VALUE 'EVENT_FEES'"),
  ]),
};
