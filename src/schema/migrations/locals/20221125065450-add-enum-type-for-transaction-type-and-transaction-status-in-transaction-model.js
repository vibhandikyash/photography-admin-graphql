/* eslint-disable no-unused-vars */
/* eslint-disable quotes */

module.exports = {
  up: async (queryInterface, Sequelize) => Promise.all([
    queryInterface.sequelize.query(`ALTER TYPE "enum_transactions_transaction_type" ADD VALUE 'COMMISSION'`),
    queryInterface.sequelize.query(`ALTER TYPE "enum_transactions_transaction_status" ADD VALUE 'CANCELLED'`),
  ]),
};
