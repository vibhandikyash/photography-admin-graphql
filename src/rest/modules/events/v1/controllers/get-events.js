/* eslint-disable prefer-const */
const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../../../config/config');
const {
  sequelize,
  Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const { OK, NOT_FOUND } = require('../../../../services/http-status-codes');
const eventLogger = require('../../event-logger');

const getRecruiterLeads = async (req, res, next) => {
  try {
    const { user } = req;

    let sqlDataQuery; let sqlCountQuery; let replacements = {};
    const {
      skip = 0, limit = QUERY_PAGING_MIN_COUNT, status,
    } = req.query;

    sqlDataQuery = `select e.id,
    e.name,
    e.status,
    e.location,
    e.start_date,
    e.end_date
    from "events" e
    left join "users" u
    on u.id = e.created_by
    where ((u."role" = 'RECRUITER' and e.created_by = :createdBy and u.deleted_at is null) and e.deleted_at is null)`;
    replacements = { ...replacements, createdBy: user.id };

    if (status) {
      if (status) { sqlDataQuery = `${sqlDataQuery} and e.status in (:eventStatus)`; replacements = { ...replacements, eventStatus: status }; }
    }
    sqlDataQuery += ' group by e.name, e.status, e.created_by, u.id, e.id';

    sqlCountQuery = `SELECT COUNT(*) FROM(${sqlDataQuery}) as usersCount`;

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
      throw new ApiError('NO_EVENTS_ARE_ASSIGNED', NOT_FOUND);
    }

    return sendSuccessResponse(res, 'SUCCESS', OK, result);
  } catch (error) {
    eventLogger(`Error from get-events: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getRecruiterLeads;
