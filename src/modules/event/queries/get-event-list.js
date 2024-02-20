const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const {
  WEDLANCER_COORDINATOR, REGULARIZE_REQUEST_TYPES: { REGULARIZE, INSUFFICIENT_HOURS }, PENDING,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const eventLogger = require('../event-logger');

const sortMapper = {
  id: 'e.id',
  name: 'e.name',
  location: 'e.location',
  recruiterName: 'r.full_name',
  recruiterType: 'up.type_key',
  wedlancerCoordinator: 'u."full_name"',
  status: 'e.status',
  leadType: 'e.lead_type',
  createdAt: 'e.created_at',
  updatedAt: 'e.updated_at',
};

const searchColumns = [
  'e.name',
  'e.status::text',
  'u.full_name',
  'up.type_key',
  'r.full_name',
  'af.full_name',
  'rf.full_name',
];

const getEventList = async (_, args, ctx) => {
  try {
    const { user } = ctx.req;
    let sqlDataQuery;
    const {
      filter: {
        sortOn = 'id', sortBy = 'DESC', skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      } = {}, where: {
        name, location, recruiterType, eventDate: { from: startDate, to: endDate } = {}, status, leadType,
      } = {},
    } = args;
    let replacements = {
      recruiterType,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
      eventName: name,
      location,
      eventStatus: status,
      leadType,
      startDate,
      endDate,
      regularize: REGULARIZE,
      insufficientHours: INSUFFICIENT_HOURS,
      pending: PENDING,
    };

    sqlDataQuery = `SELECT e.id, e.name, CAST(e.status as text), e."lead_type", e."start_date", e."end_date", e."created_by", e."location",
      MAX(u."full_name") as wedlancer_coordinator, MAX(up."type_key") as recruiter_type, MAX(r."full_name") as recruiter_name,
      COUNT(CASE WHEN rr.request_type = :regularize AND rr.status = :pending THEN 1 END) AS "regularizeRequests",
      COUNT(CASE WHEN rr.request_type = :insufficientHours AND rr.status = :pending THEN 1 END) AS "insufficientHoursRequests",
      MAX(r.id::TEXT) as recruiter_id,
      JSONB_BUILD_OBJECT('id', MAX(aef.user_id::TEXT), 'fullName', MAX(af.full_name)) AS "assignedFreelancer",
      JSONB_BUILD_OBJECT('id', MAX(ref.user_id::TEXT), 'fullName', MAX(rf.full_name)) AS "requestedFreelancer",
      CASE WHEN (COUNT(DISTINCT aef.id) = MAX(ucr."count")) THEN true ELSE false END AS "allFreelancerAssigned",
      CASE WHEN (MAX(afp.type_key) = 'WEDLANCER_ASSURED' and e.is_assigned = true) THEN TRUE
      ELSE CASE
        WHEN (MAX(afp.type_key) != 'WEDLANCER_ASSURED') THEN NULL
        ELSE FALSE END
      END AS "isWedlancerCoordinatorAssigned",
      (SELECT to_jsonb(eventLocationDetails) AS eventLocationDetails FROM (SELECT c.id, c.name AS "location_name" FROM cities c WHERE c.id = e.location) AS eventLocationDetails) AS event_location_details
      FROM events e
        LEFT JOIN "users" u ON u."id" = e."assigned_to"
        LEFT JOIN "users" r ON r."id" = e."recruiter_id"
        LEFT JOIN "user_profiles" up ON up."user_id" = e."recruiter_id"
        LEFT JOIN "regularize_requests" rr ON rr.event_id = e.id AND rr.deleted_at IS NULL
        LEFT JOIN event_freelancers aef ON aef.event_id = e.id AND aef.deleted_at IS NULL AND aef.is_assigned = true
        LEFT JOIN event_freelancers ref ON ref.event_id = e.id AND ref.deleted_at IS NULL AND ref.is_requested = true
        LEFT JOIN "users" af ON aef.user_id = af.id AND af.deleted_at IS NULL
        LEFT JOIN user_profiles afp ON afp.user_id = af.id AND afp.deleted_at IS NULL
        LEFT JOIN "users" rf on ref.user_id = rf.id AND rf.deleted_at IS NULL
        LEFT JOIN (SELECT event_id, SUM("count") AS "count" FROM upfront_category_requirements WHERE deleted_at IS NULL GROUP BY event_id) ucr ON ucr.event_id = e.id
        WHERE e."deleted_at" IS NULL `;
    if (user.role === WEDLANCER_COORDINATOR) {
      sqlDataQuery = `SELECT e.id, e.name, e.status, e."lead_type", e."start_date", e."end_date", e."created_by", e."location",
      MAX(u."full_name") AS wedlancer_coordinator, MAX(up."type_key") AS recruiter_type, MAX(r."full_name") AS recruiter_name, MAX(r.id::text) AS recruiter_id,
      JSONB_BUILD_OBJECT('id', MAX(aef.user_id::text), 'fullName', MAX(af.full_name)) AS "assignedFreelancer",
      JSONB_BUILD_OBJECT('id', MAX(ref.user_id::text), 'fullName', MAX(rf.full_name)) AS "requestedFreelancer",
      COUNT(CASE WHEN rr.request_type = :regularize AND rr.status = :pending THEN 1 END) AS "regularizeRequests",
      COUNT(CASE WHEN rr.request_type = :insufficientHours AND rr.status = :pending THEN 1 END) AS "insufficientHoursRequests",
      CASE WHEN (COUNT(DISTINCT aef.id) = MAX(ucr."count")) THEN true ELSE false END AS "allFreelancerAssigned"
      FROM events e
        LEFT JOIN "users" r ON r."id" = e."recruiter_id" AND r."deleted_at" IS NULL
        LEFT JOIN "users" u ON u."id" = e."assigned_to" AND u."deleted_at" IS NULL
        LEFT JOIN "user_profiles" up ON up."user_id" = e."recruiter_id" AND up."deleted_at" IS NULL
        LEFT JOIN "regularize_requests" rr ON rr.event_id = e.id AND rr.deleted_at IS NULL
        LEFT JOIN event_freelancers aef ON aef.event_id = e.id AND aef.deleted_at IS NULL AND aef.is_assigned = true
        LEFT JOIN event_freelancers ref ON ref.event_id = e.id AND ref.deleted_at IS NULL AND ref.is_requested = true
        LEFT JOIN "users" af ON aef.user_id = af.id AND af.deleted_at IS NULL
        LEFT JOIN "users" rf on ref.user_id = rf.id AND rf.deleted_at IS NULL
        LEFT JOIN (SELECT event_id, SUM("count") AS "count" FROM upfront_category_requirements WHERE deleted_at IS NULL GROUP BY event_id) ucr ON ucr.event_id = e.id
      WHERE e."assigned_to" = :wcId AND e."deleted_at" IS NULL`;
      replacements.wcId = user.id;
    }

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

    if (recruiterType && recruiterType.length) { sqlDataQuery = `${sqlDataQuery} AND up.type_key in (:recruiterType)`; }
    if (name && name.length) { sqlDataQuery = `${sqlDataQuery} AND e."name" IN (:eventName)`; }
    if (location && location.length) { sqlDataQuery = `${sqlDataQuery} AND e."location" IN (:location)`; }
    if (status && status.length) { sqlDataQuery = `${sqlDataQuery} AND e."status" IN (:eventStatus)`; }
    if (leadType && leadType.length) { sqlDataQuery = `${sqlDataQuery} AND e."lead_type" IN (:leadType)`; }
    if (startDate && !endDate) { sqlDataQuery = `${sqlDataQuery} AND e."start_date" >= :startDate`; }
    if (endDate && !startDate) { sqlDataQuery = `${sqlDataQuery} AND e."end_date" <= :endDate`; }
    if (startDate && endDate) {
      sqlDataQuery = `${sqlDataQuery} AND (e."start_date" between :startDate AND :endDate OR e."end_date" BETWEEN :startDate AND :endDate)`;
    }

    sqlDataQuery += ' GROUP BY e.id, u.id,r.id, up.id';
    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) AS usersCount`;

    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy} NULLS LAST LIMIT :limit OFFSET :skip`;

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    const result = {
      count: parseInt(count[0].count, 10),
      data,
    };
    return result;
  } catch (error) {
    eventLogger(`Error while getting event list : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getEventList;
