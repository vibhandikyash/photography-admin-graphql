/* eslint-disable prefer-const */
const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../../../config/config');
const {
  sequelize,
  Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const { BAD_REQUEST, OK } = require('../../../../services/http-status-codes');
const eventLogger = require('../../../events/event-logger');

const getFreelancerLeads = async (req, res, next) => {
  try {
    const { user } = req;
    let sqlDataQuery; let sqlCountQuery; let replacements = {};
    const {
      skip = 0, limit = QUERY_PAGING_MIN_COUNT, status,
    } = req.query;

    sqlDataQuery = `select ef.id,
    ef.user_id,
    e.id as "eventId",
    e.name,
    e.status,
    e.created_by as "createdBy",
    e.start_date as "startDate",
    e.end_date as "endDate",
    e."location"
    from public.event_freelancers ef
    left join "users" u
    on u.id = ef.user_id
    left join "events" e
    on e.id = ef.event_id
    where ((ef.user_id = :userId and u.role = 'FREELANCER' and ef.is_assigned  = true) and ef.deleted_at is null)`;
    replacements = { ...replacements, userId: user.id };

    if (status) {
      if (status) { sqlDataQuery = `${sqlDataQuery} and e.status in (:eventStatus)`; replacements = { ...replacements, eventStatus: status }; }
    }

    sqlDataQuery += ' group by e.name, e.status, e.created_by, ef.id, e.id';

    sqlCountQuery = `SELECT COUNT(*) FROM(${sqlDataQuery}) as usersCount`;

    // eslint-disable-next-line security/detect-object-injection
    sqlDataQuery += ' limit :limit offset :skip';
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

    if (!result) {
      throw new ApiError('NO_EVENTS_ARE_ASSIGNED', BAD_REQUEST);
    }

    return sendSuccessResponse(res, 'SUCCESS', OK, result);
  } catch (error) {
    eventLogger(`Error in getting - freelancer - leads: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getFreelancerLeads;
