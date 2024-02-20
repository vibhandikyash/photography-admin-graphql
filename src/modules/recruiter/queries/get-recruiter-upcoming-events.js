const { get } = require('lodash');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { UPCOMING } = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const recruiterLogger = require('../recruiter-logger');

const getRecruiterUpcomingEvents = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } } } = ctx;
    let { filter: { limit = QUERY_PAGING_MIN_COUNT } } = args;
    const { filter: { skip: offset = 0 }, where: { eventDate: { from: startDate, to: endDate } } } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);
    const replacements = {
      startDate, endDate, userId, status: UPCOMING, limit, offset,
    };

    let sqlDataQuery = `(SELECT e.id,e."name", e.start_date as "startDate", e.end_date as "endDate", null as note, 'EVENT' as "type",
      JSON_BUILD_OBJECT('id', c.id, 'name', c."name", 'stateCode', c.state_code, 'countryCode', c.country_code) as cities
      FROM events e
      INNER JOIN cities c on c.id = e."location"
      WHERE e.status = :status AND (e.recruiter_id = :userId)
      AND (e."deleted_at" is null AND c."deleted_at" is null) AND (e.start_date <= :endDate AND e.end_date >= :startDate))
      UNION ALL (SELECT fc.id,null as name, fc.start_date as "startDate", fc.end_date as "endDate",fc.note,'CUSTOM' as "type", JSON_BUILD_OBJECT() as cities
      FROM freelancer_calenders fc
      WHERE fc.user_id = :userId AND fc."deleted_at" is null AND fc.event_id is null AND (fc.start_date <= :endDate AND fc.end_date >= :startDate))`;

    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as "eventCount"`;
    sqlDataQuery = `${sqlDataQuery} order by "startDate" ASC limit :limit offset :offset`;

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const dataCount = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    return { count: get(dataCount, '[0].count'), data };
  } catch (error) {
    recruiterLogger(`Error from getting recruiter upcoming events for web: ${error}`, ctx, 'error');
    throw error;
  }
};
module.exports = getRecruiterUpcomingEvents;
