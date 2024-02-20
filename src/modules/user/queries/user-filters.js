const Sequelize = require('sequelize');

const { sequelize } = require('../../../sequelize-client');
const commonFilter = require('../../../utils/common-filter');

const userLogger = require('../user-logger');

const roles = ['SUPER_ADMIN', 'ADMIN', 'FREELANCER', 'RECRUITER'];

const sortMapper = {
  verificationStatus: 'verification_status',
  role: 'role',
  isFeatured: 'is_featured',
  isActive: 'is_active',
};

const userFilters = async (_, args, ctx) => {
  try {
    const { user } = ctx.req;
    args.filter.getDBField = sortMapper[args.filter.getDBField] ? sortMapper[args.filter.getDBField] : 'id';
    args.filter.sortOn = sortMapper[args.filter.sortOn] ? sortMapper[args.filter.sortOn] : 'id';
    const { sqlQuery, sqlCountQuery } = await commonFilter('users', args.filter, user);
    let data = await sequelize.query(sqlQuery, { type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { type: Sequelize.QueryTypes.SELECT });

    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < data.length; index++) {
      if (roles.includes(data[index].role)) {
        delete data[index];
      }
    }
    data = data.filter(item => item);
    const response = {
      data,
      count: count[0].count,
    };

    return response;
  } catch (error) {
    userLogger(`Error from  user filter : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = userFilters;
