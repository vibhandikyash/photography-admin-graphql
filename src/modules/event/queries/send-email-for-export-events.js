const converter = require('json-2-csv');
const Sequelize = require('sequelize');

const {
  WEDLANCER_COORDINATOR, CSV_EXPORT_CONTENT_TYPE, SUCCESS, REGULARIZE_REQUEST_TYPES: { REGULARIZE, INSUFFICIENT_HOURS }, PENDING,
  ORGANIC, UPFRONT,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { EXPORT_EVENTS_CSV } = require('../../../shared-lib/emails/constants/email-template-constants');
const sendEmail = require('../../../shared-lib/sendgrid');
const { getMessage } = require('../../../utils/messages');
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

const sendEmailForExportEventsService = async (filter = {}, where = {}, role, email, userId, ctx) => {
  try {
    let sqlDataQuery;
    const { sortOn = 'name', sortBy = 'DESC', search = null } = filter;
    const {
      name, location, recruiterType, eventDate: { from: startDate, to: endDate } = {}, status, leadType,
    } = where;

    const replacements = {
      recruiterType,
      eventName: name,
      location,
      eventStatus: status,
      leadType,
      organic: ORGANIC,
      upfront: UPFRONT,
      pending: PENDING,
      startDate,
      endDate,
      regularize: REGULARIZE,
      insufficientHours: INSUFFICIENT_HOURS,
    };

    sqlDataQuery = `SELECT e.name AS "eventName", to_char(e."start_date" :: DATE, 'mm/dd/yyyy') as date, c.name AS location, r."full_name" AS recruiter, up."type_key" AS recruiterType, cast(e.status AS text) AS eventStatus,
      CASE WHEN (MAX(afp.type_key) = 'WEDLANCER_ASSURED' and e.is_assigned = true) THEN 'ASSIGNED'
      ELSE CASE
        WHEN (MAX(afp.type_key) != 'WEDLANCER_ASSURED') THEN 'NULL'
        ELSE 'PENDING' END
      END AS "WedlancerCoordinatorStatus",
      CASE
        WHEN e.lead_type = :upfront THEN
            CASE WHEN (COUNT(DISTINCT aef.id) = MAX(ucr."count")) THEN 'ASSIGNED' ELSE 'PENDING' END
        WHEN e.lead_type = :organic AND COUNT(DISTINCT aef.is_assigned) = 1 THEN 'ASSIGNED' ELSE 'PENDING'
      END AS "AllFreelancerAssigned",
      COUNT(CASE WHEN rr.request_type = :regularize AND rr.status = :pending THEN 1 END) AS "RegularizeRequests",
      COUNT(CASE WHEN rr.request_type = :insufficientHours AND rr.status = :pending THEN 1 END) AS "InsufficientHoursRequests"`;
    sqlDataQuery += leadType?.includes(ORGANIC) ? ', MAX(af.full_name) AS "AssignedFreelancer", MAX(rf.full_name) AS "RequestedFreelancer"' : '';
    sqlDataQuery += `
      FROM events e
        LEFT JOIN "users" u ON u."id" = e."assigned_to" AND u.deleted_at IS NULL
        LEFT JOIN "users" r ON r."id" = e."recruiter_id" AND r.deleted_at IS NULL
        LEFT JOIN "user_profiles" up ON up."user_id" = e."recruiter_id" AND up.deleted_at IS NULL
        LEFT JOIN "regularize_requests" rr ON rr.event_id = e.id AND rr.deleted_at IS NULL
        LEFT JOIN cities c ON c.id = e.location AND c.deleted_at IS NULL
        LEFT JOIN event_freelancers aef ON aef.event_id = e.id AND aef.deleted_at IS NULL AND aef.is_assigned = true
        LEFT JOIN event_freelancers ref ON ref.event_id = e.id AND ref.deleted_at IS NULL AND ref.is_requested = true
        LEFT JOIN "users" af ON aef.user_id = af.id AND af.deleted_at IS NULL
        LEFT JOIN "users" rf on ref.user_id = rf.id AND rf.deleted_at IS NULL
        LEFT JOIN user_profiles afp ON afp.user_id = af.id AND afp.deleted_at IS NULL
        LEFT JOIN (SELECT event_id, SUM("count") AS "count" FROM upfront_category_requirements WHERE deleted_at IS NULL GROUP BY event_id) ucr ON ucr.event_id = e.id
      WHERE e."deleted_at" IS NULL`;

    if (role === WEDLANCER_COORDINATOR) {
      sqlDataQuery = `SELECT e.name AS "eventName", to_char(e."start_date" :: DATE, 'mm/dd/yyyy') as date, c.name AS "location", r."full_name" AS recruiter, up."type_key" AS recruiterType, cast(e.status AS text) AS eventStatus,
      CASE
        WHEN e.lead_type = :upfront THEN
            CASE WHEN (COUNT(DISTINCT aef.id) = MAX(ucr."count")) THEN 'ASSIGNED' ELSE 'PENDING' END
        WHEN e.lead_type = :organic AND COUNT(DISTINCT aef.is_assigned) = 1 THEN 'ASSIGNED' ELSE 'PENDING'
      END AS "AllFreelancerAssigned",
      COUNT(CASE WHEN rr.request_type = :regularize AND rr.status = :pending THEN 1 END) AS "RegularizeRequests",
      COUNT(CASE WHEN rr.request_type = :insufficientHours AND rr.status = :pending THEN 1 END) AS "InsufficientHoursRequests"`;
      sqlDataQuery += leadType?.includes(ORGANIC) ? ', MAX(af.full_name) AS "AssignedFreelancer", MAX(rf.full_name) AS "RequestedFreelancer"' : '';
      sqlDataQuery += `
      FROM events e
        LEFT JOIN "users" r ON r."id" = e."recruiter_id" AND r."deleted_at" IS NULL
        LEFT JOIN "users" u ON u."id" = e."assigned_to" AND u."deleted_at" IS NULL
        LEFT JOIN "user_profiles" up ON up."user_id" = e."recruiter_id" AND up."deleted_at" IS NULL
        LEFT JOIN cities c ON c.id = e.location AND c.deleted_at IS NULL
        LEFT JOIN "regularize_requests" rr ON rr.event_id = e.id AND rr.deleted_at IS NULL
        LEFT JOIN event_freelancers aef ON aef.event_id = e.id AND aef.deleted_at IS NULL AND aef.is_assigned = true
        LEFT JOIN event_freelancers ref ON ref.event_id = e.id AND ref.deleted_at IS NULL AND ref.is_requested = true
        LEFT JOIN "users" af ON aef.user_id = af.id AND af.deleted_at IS NULL
        LEFT JOIN "users" rf on ref.user_id = rf.id AND rf.deleted_at IS NULL
        LEFT JOIN (SELECT event_id, SUM("count") AS "count" FROM upfront_category_requirements WHERE deleted_at IS NULL GROUP BY event_id) ucr ON ucr.event_id = e.id
      WHERE e."assigned_to" = :wcId AND e."deleted_at" IS NULL`;
      replacements.wcId = userId;
    }

    if (search) {
      sqlDataQuery += ` AND (e.name ILIKE :search OR e.status::text ILIKE :search OR u.full_name ILIKE :search OR
        r.full_name ILIKE :search OR up.type_key ILIKE :search OR af.full_name ILIKE :search OR rf.full_name ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
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

    sqlDataQuery += ` GROUP BY e.id,u.id,up.id,r.id,c.name ORDER BY ${sortMapper[sortOn]} ${sortBy}`;

    let data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    data = JSON.parse(JSON.stringify(data));
    const csvData = await converter.json2csv(data, {});
    const templateData = {
      templateKey: EXPORT_EVENTS_CSV,
      toEmailAddress: email,
      attachments: [{
        content: Buffer.from(csvData).toString('base64'),
        filename: 'events.csv',
        type: CSV_EXPORT_CONTENT_TYPE,
        disposition: 'attachment',
      }],
    };
    sendEmail(templateData);
  } catch (error) {
    eventLogger(`Error from sendEmailForExportEventsService, ${error}`, ctx, 'error');
  }
};

const sendEmailForExportEvents = async (_, args, ctx) => {
  try {
    const { req: { user: { role, email, id: userId } }, localeService } = ctx;
    const { filter, where } = args;
    sendEmailForExportEventsService(filter, where, role, email, userId, ctx);
    const response = { status: SUCCESS, message: getMessage('EXPORTED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    eventLogger(`Error from sendEmailForExportEvents : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = sendEmailForExportEvents;
