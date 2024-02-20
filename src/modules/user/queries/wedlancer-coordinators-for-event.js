const moment = require('moment');
const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { WEDLANCER_COORDINATOR } = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const userLogger = require('../user-logger');

const sortMapper = {
  fullName: 'u.full_name',
  eventName: 'e.name',
  contactNo: 'u.contact_no',
  createdAt: 'e.created_at',
  updatedAt: 'e.updated_at',
};

const searchColumns = [
  'u.full_name',
  'u.contact_no',
  'e.name',
];

const wedlancerCoordinatorsForEvent = async (_, args, ctx) => {
  try {
    let sqlDataQuery; let replacements = {};
    const {
      filter: {
        sortOn = 'createdAt', sortBy = 'DESC', skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      }, where,
    } = args;

    sqlDataQuery = `select
      u.id,
      u.user_name,
      u.full_name,
      u.country_code,
      u.contact_no,
      e."id" as event_id,
      e.name as event_name,
      e."location" as event_location,
      e."start_date",
      e."end_date",
      e.lead_type as "event_type",
      e.status as "event_status",
      (
        select to_jsonb(eventLocationDetails) as eventLocationDetails
        from (
          select c.id,c.name as "location_name" from public."cities" c where c.id = e.location
        ) as eventLocationDetails
      ) as event_location_details
      from
        public."users" u
      left join "events" e
          on
        u.id = e."assigned_to"
      where
        u."role" = :role and (u.deleted_at is null and e.deleted_at is null and u.account_deleted_at is null)`;
    replacements = { ...replacements, role: WEDLANCER_COORDINATOR };

    if (search) {
      searchColumns.forEach(field => {
        if (searchColumns.indexOf(field) === 0) {
          sqlDataQuery += ` and (${field} ilike :searchValue`;
        } else if (searchColumns.indexOf(field) === (searchColumns.length - 1)) {
          sqlDataQuery += ` or ${field} ilike :searchValue)`;
        } else {
          sqlDataQuery += ` or ${field} ilike :searchValue`;
        }
      });
      replacements = { ...replacements, searchValue: `%${search}%` };
    }

    if (where) {
      if (where.name && where.name.length) { sqlDataQuery = `${sqlDataQuery} and u."full_name" in (:name)`; replacements = { ...replacements, name: where.name }; }
      if (where.contactNo && where.contactNo.length) { sqlDataQuery = `${sqlDataQuery} and u."contact_no" in (:contactNo)`; replacements = { ...replacements, contactNo: where.contactNo }; }
      if (where.eventLocation && where.eventLocation.length) { sqlDataQuery = `${sqlDataQuery} and e."location" in (:location)`; replacements = { ...replacements, location: where.eventLocation }; }
      if (where.eventName && where.eventName.length) { sqlDataQuery = `${sqlDataQuery} and e."name" in (:eventName)`; replacements = { ...replacements, eventName: where.eventName }; }
      if (where.isActive) { sqlDataQuery = `${sqlDataQuery} and u."is_active" in (:isActive)`; replacements = { ...replacements, isActive: where.isActive }; }
      if (where.eventDate) {
        const { eventDate: { from: startDate, to: endDate } = {} } = where;
        if (startDate && !endDate) { sqlDataQuery = `${sqlDataQuery} and e."start_date" >= :startDate`; replacements = { ...replacements, startDate: moment(startDate).format() }; }
        if (endDate && !startDate) { sqlDataQuery = `${sqlDataQuery} and e."end_date" <= :endDate`; replacements = { ...replacements, endDate: moment(endDate).format() }; }
        if (startDate && endDate) {
          sqlDataQuery = `${sqlDataQuery} and (e."start_date" between :startDate and :endDate or e."end_date" between :startDate and :endDate)`;
          replacements = { ...replacements, startDate: moment(startDate).format(), endDate: moment(endDate).format() };
        }
      }
    }

    sqlDataQuery += ' group by u."id", e."id", e."name",e."location", e."start_date",e."end_date"';
    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as usersCount`;

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
    userLogger(`Error while getting wedlancer coordinator list for event: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = wedlancerCoordinatorsForEvent;
