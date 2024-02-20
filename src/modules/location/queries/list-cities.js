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

const listCities = async (_, args, ctx) => {
  try {
    let sqlDataQuery; let sqlCountQuery; let replacements = {};
    const {
      filter: {
        skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      }, where,
    } = args;

    sqlDataQuery = `select
    city.id,
    city.name
    from
      public.cities city
     where
      ( city.deleted_at is null)`;

    if (search) {
      searchColumns.map(field => {
        if (searchColumns.indexOf(field) == 0) {
          sqlDataQuery += ` and (${field} iLike :searchValue)`;
        } else if (searchColumns.indexOf(field) == (searchColumns.length - 1)) {
          sqlDataQuery += ` or ${field} iLike :searchValue)`;
        } else {
          sqlDataQuery += ` or ${field} iLike :searchValue`;
        }
      });
      replacements = { ...replacements, searchValue: `%${search}%` };
    }

    if (where) {
      if (where.stateId && where.stateId.length) { sqlDataQuery = `${sqlDataQuery} and city.state_id in (:stateId)`; replacements = { ...replacements, stateId: where.stateId }; }
      if (where.countryId && where.countryId.length) { sqlDataQuery = `${sqlDataQuery} and city.country_id in (:countryId)`; replacements = { ...replacements, countryId: where.countryId }; }
    }

    sqlDataQuery += ' group by city.id';
    sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as citiesCount`;

    // eslint-disable-next-line security/detect-object-injection
    sqlDataQuery += ' ORDER BY city.name limit :limit offset :skip';
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
    locationLogger(`Error from list-cities : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listCities;
