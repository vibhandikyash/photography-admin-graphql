/* eslint-disable prefer-const */
/* eslint-disable eqeqeq */
/* eslint-disable array-callback-return */
const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { sequelize } = require('../../../sequelize-client');
const locationLogger = require('../location-logger');

const searchColumns = [
  'name',
];

const listCountries = async (_, args, ctx) => {
  try {
    let sqlDataQuery; let sqlCountQuery; let replacements = {};
    const {
      filter: {
        skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      },
    } = args;

    sqlDataQuery = `select
    c.id,
    c.name
    from
      public.countries c
     where
      (c.deleted_at is null)`;

    if (search) {
      searchColumns.map(field => {
        if (searchColumns.indexOf(field) == 0) {
          sqlDataQuery += ` and (${field} iLike :searchValue)`;
        } else if (searchColumns.indexOf(field) == (searchColumns.length - 1)) {
          sqlDataQuery += ` or ${field} iLike :searchValue)`;
        } else {
          sqlDataQuery += ` or ${field} iLike :searchValue)`;
        }
      });
      replacements = { ...replacements, searchValue: `${search}%` };
    }
    sqlDataQuery += ' group by c.name, c.id';
    sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as countriesCount`;

    // eslint-disable-next-line security/detect-object-injection
    sqlDataQuery += ' ORDER BY c.name limit :limit offset :skip';
    replacements = {
      ...replacements,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
    };
    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    const result = {
      count: parseInt(count[0].count, 10),
      data,
    };
    return result;
  } catch (error) {
    locationLogger(`Error from list-countries : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listCountries;
