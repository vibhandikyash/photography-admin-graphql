/* eslint-disable no-restricted-syntax */
const { isArray } = require('lodash');

const defaultLogger = require('../logger');

const commonFilter = async (tableName = 'user', filter = {}, user) => {
  try {
    const {
      sortBy = 'ASC', skip = 0, getDBField = 'id', search = '', sortOn = 'id', distinct = true, limit = 20,
    } = filter;
    let sqlQuery = '';
    let dbFields = [];

    if (!isArray(getDBField)) {
      dbFields = [getDBField];
    } else {
      dbFields = getDBField;
    }

    if (distinct) {
      sqlQuery += ` select distinct ${sortOn} ,`;
    } else {
      sqlQuery += ` select ${sortOn} ,`;
    }

    dbFields = dbFields.map(field => field);

    for (const dbField of dbFields) {
      if (dbFields.indexOf(dbField) === 0 && dbFields.indexOf(dbField) === (dbFields.length - 1)) {
        sqlQuery += ` ${dbField} from "${tableName}" `;
      } else if (dbFields.indexOf(dbField) === 0 && dbFields.indexOf(dbField) !== (dbFields.length - 1)) {
        sqlQuery += ` ${dbField} `;
      } else if (dbFields.indexOf(dbField) === (dbFields.length - 1)) {
        sqlQuery += ` , ${dbField} from "${tableName}"`;
      } else {
        sqlQuery += ` , ${dbField} `;
      }
    }

    sqlQuery += ' where deleted_at is null';

    if (tableName === 'user') {
      sqlQuery += ` and id != '${user.id}'`;
    }

    if (search) {
      for (const dbField of dbFields) {
        if (dbFields.indexOf(dbField) === 0) {
          sqlQuery += ` and ${dbField}::text ilike '%${search.trim()}%'`;
        } else {
          sqlQuery += ` or ${dbField}::text ilike '%${search.trim()}%'`;
        }
      }
    }

    const sqlCountQuery = `SELECT COUNT(*) from (${sqlQuery}) as "dataCount"`;
    sqlQuery += ` order by ${sortOn} ${sortBy} limit ${limit} offset ${skip}`;
    return { sqlQuery, sqlCountQuery };
  } catch (error) {
    defaultLogger(`Error in common filter > ${error}`, null, 'error');
    throw error;
  }
};

module.exports = commonFilter;

