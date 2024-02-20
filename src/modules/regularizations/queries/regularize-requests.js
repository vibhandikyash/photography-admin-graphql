const moment = require('moment');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { PENDING, APPROVED, REGULARIZE_PRIORITY_HOURS: { MAX_PRIORITY_HOURS, MIN_PRIORITY_HOURS } } = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const regularizationLogger = require('../regularization-logger');

const listRegularizeRequests = async (_, args, ctx) => {
  try {
    const { filter: { skip = 0, limit = QUERY_PAGING_MIN_COUNT }, where: { eventId } } = args;
    const currentTime = moment().format();

    const sqlDataQuery = `SELECT
      rr.id, rr.user_id as "userId", rr.request_type as "requestType", rr.status,et.start_date as "startDate", et.end_date as "endDate", rr.ticket_no as "ticketNo",
      (CASE
        WHEN rr.status = :pendingState THEN
        CASE
          WHEN ((DATE_PART('day', :currentTime::timestamp - rr.created_at::timestamp) * 24) + DATE_PART('hour', :currentTime::timestamp - rr.created_at::timestamp)) <= :minPriorityHours then 'NORMAL'
          WHEN ((DATE_PART('day', :currentTime::timestamp - rr.created_at::timestamp) * 24) + DATE_PART('hour', :currentTime::timestamp - rr.created_at::timestamp)) between :minPriorityHours and :maxPriorityHours then 'URGENT'
          WHEN ((DATE_PART('day', :currentTime::timestamp - rr.created_at::timestamp) * 24) + DATE_PART('hour', :currentTime::timestamp - rr.created_at::timestamp)) >= :maxPriorityHours then 'HIGH'
        END
      END) as priority
    FROM regularize_requests rr
    RIGHT JOIN event_timings et ON et.id = rr.event_timing_id AND et.deleted_at is null
    WHERE rr.event_id = :eventId AND rr.deleted_at is null
    ORDER BY
        CASE
          WHEN rr.status = :pendingState THEN 0
          WHEN rr.status  = :approvedState THEN 1
        END ASC, ((DATE_PART('day', :currentTime::timestamp - rr.created_at::timestamp) * 24) + DATE_PART('hour', :currentTime::timestamp - rr.created_at::timestamp)) DESC LIMIT :limit OFFSET :skip`;

    const replacements = {
      eventId,
      currentTime,
      minPriorityHours: MIN_PRIORITY_HOURS,
      maxPriorityHours: MAX_PRIORITY_HOURS,
      pendingState: PENDING,
      approvedState: APPROVED,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
    };

    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) AS requestsCount`;

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    const result = { count: parseInt(count[0].count, 10), data };
    return result;
  } catch (error) {
    regularizationLogger(`Error from listing regularization request, ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listRegularizeRequests;
