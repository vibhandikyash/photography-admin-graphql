const Sequelize = require('sequelize');

const { sequelize } = require('../../../sequelize-client');
const commonFilter = require('../../../utils/common-filter');

const eventLogger = require('../event-logger');

const sortMapper = {
  id: 'id',
  name: 'name',
  location: 'location',
  status: 'status',
  leadType: 'lead_type',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const eventFilters = async (_, args, ctx) => {
  try {
    const { user } = ctx.req;
    args.filter.getDBField = sortMapper[args.filter.getDBField] ? sortMapper[args.filter.getDBField] : 'id';
    args.filter.sortOn = sortMapper[args.filter.sortOn] ? sortMapper[args.filter.sortOn] : 'id';
    const { sqlQuery, sqlCountQuery } = await commonFilter('events', args.filter, user);
    const data = await sequelize.query(sqlQuery, { type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { type: Sequelize.QueryTypes.SELECT });

    const response = {
      data,
      count: count[0].count,
    };

    return response;
  } catch (error) {
    eventLogger(`Error from  event filter : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = eventFilters;
