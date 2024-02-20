const Sequelize = require('sequelize');

const { sequelize } = require('../../../sequelize-client');
const commonFilter = require('../../../utils/common-filter');

const userLogger = require('../event-logger');

const sortMapper = {
  id: 'id',
  raisedBy: 'raised_by',
  raisedFor: 'user_id',
  createdAt: 'created_at',
  status: 'status',
};

const issueFilters = async (_, args, ctx) => {
  try {
    const { user } = ctx.req;
    args.filter.getDBField = sortMapper[args.filter.getDBField] ? sortMapper[args.filter.getDBField] : 'id';
    args.filter.sortOn = sortMapper[args.filter.sortOn] ? sortMapper[args.filter.sortOn] : 'id';
    const { sqlQuery, sqlCountQuery } = await commonFilter('disputes', args.filter, user);
    const data = await sequelize.query(sqlQuery, { type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { type: Sequelize.QueryTypes.SELECT });
    const response = {
      data,
      count: count[0].count,
    };
    return response;
  } catch (error) {
    userLogger(`Error from  issue filter : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = issueFilters;
