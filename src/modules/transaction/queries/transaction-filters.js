const Sequelize = require('sequelize');

const { sequelize } = require('../../../sequelize-client');
const commonFilter = require('../../../utils/common-filter');

const transactionLogger = require('../transaction-logger');

const sortMapper = {
  transactionType: 'transaction_type',
  transactionStatus: 'transaction_status',
  modeOfTransaction: 'mode_of_transaction',
  transactionSubTypeStatus: 'transaction_sub_type_status',
  eventId: 'event_id',
  userId: 'user_id',
  createdAt: 'created_at',
  amount: 'amount',
};

const transactionFilters = async (_, args, ctx) => {
  try {
    const { user } = ctx.req;
    args.filter.getDBField = sortMapper[args.filter.getDBField] ? sortMapper[args.filter.getDBField] : 'id';
    args.filter.sortOn = sortMapper[args.filter.sortOn] ? sortMapper[args.filter.sortOn] : 'id';
    const { sqlQuery, sqlCountQuery } = await commonFilter('transactions', args.filter, user);
    const data = await sequelize.query(sqlQuery, { type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { type: Sequelize.QueryTypes.SELECT });

    const response = {
      data,
      count: count[0].count,
    };

    return response;
  } catch (error) {
    transactionLogger(`Error from transaction filter : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = transactionFilters;
