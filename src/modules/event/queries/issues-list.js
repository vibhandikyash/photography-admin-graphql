const moment = require('moment');
const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { sequelize } = require('../../../sequelize-client');
const eventsLogger = require('../event-logger');

const sortMapper = {
  id: 'id',
  raisedBy: 'u2.full_name',
  raisedByContact: 'u.contact_no',
  raisedFor: 'u.full_name',
  raisedForContact: 'u2.contact_no',
  eventName: 'e.name',
  location: 'e.location',
  status: 'il.status',
  createdAt: 'il.created_at',
};

const searchColumns = [
  'cast(il.id as varchar)',
  'u.full_name',
  'u2.full_name',
  'e.name',
];

const listIssues = async (_, args, ctx) => {
  try {
    let sqlDataQuery; let replacements = {};
    const {
      filter: {
        sortOn = 'id', sortBy = 'DESC', skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      }, where,
    } = args;

    sqlDataQuery = `select
    il.id,il.event_id ,il.user_id ,il.status,il.created_at as "createdAt",
    u.full_name as "raisedFor",u.contact_no as "raisedForContact",u.country_code as "raisedForCountryCode",e.name as "eventName",u2.full_name as "raisedBy",u2.contact_no as "raisedByContact",
    u2.country_code as "raisedByCountryCode", il.ticket_no as "ticketNo",
    JSONB_BUILD_OBJECT(
    'id', c.id,
    'location_name', c.name
    ) as location,
    JSONB_BUILD_OBJECT(
      'id', us.id,
      'fullName', us.full_name
      ) as "wedlancerCoordinator"
    from
      disputes il
    left join "events" e on
      e.id = il.event_id
    left join "users" us on us.id = e.assigned_to
    left join cities c on
      e."location" = c.id
    left join "users" u on
      u.id = il.user_id
    left join "users" u2 on
      u2.id = il.raised_by
    where
    (u.deleted_at is null and u2.deleted_at is null)`;

    if (search) {
      searchColumns.forEach(field => {
        if (searchColumns.indexOf(field) === 0) {
          sqlDataQuery += ` and (${field} iLike :searchValue`;
        } else if (searchColumns.indexOf(field) === (searchColumns.length - 1)) {
          sqlDataQuery += ` or ${field} iLike :searchValue)`;
        } else {
          sqlDataQuery += ` or ${field} iLike :searchValue`;
        }
      });
      replacements = { ...replacements, searchValue: `%${search}%` };
    }
    if (where) {
      if (where.status && where.status.length) { sqlDataQuery = `${sqlDataQuery} and il.status in (:status)`; replacements = { ...replacements, status: where.status }; }
      if (where.location && where.location.length) { sqlDataQuery = `${sqlDataQuery} and e.location in (:location)`; replacements = { ...replacements, location: where.location }; }
      if (where.createdAt) {
        const { createdAt: { from: startDate, to: endDate } = {} } = where;
        if (startDate && endDate) {
          sqlDataQuery = `${sqlDataQuery} and (il."created_at" between :startDate and :endDate)`;
          replacements = { ...replacements, startDate: moment(startDate).format(), endDate: moment(endDate).format() };
        }
      }
    }

    sqlDataQuery += ' group by il.id, e.id, u.id, u2.id, u.contact_no,c.id, us.id';
    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as usersCount`;

    // eslint-disable-next-line security/detect-object-injection
    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy} limit :limit offset :skip`;

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
    eventsLogger(`Error from  list-issues : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listIssues;
