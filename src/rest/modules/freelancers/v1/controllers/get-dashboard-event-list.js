/* eslint-disable no-restricted-syntax */
const moment = require('moment');

const { QUERY_PAGING_MAX_COUNT, QUERY_PAGING_MIN_COUNT } = require('../../../../../config/config');

const {
  sequelize,
  Sequelize,
} = require('../../../../../sequelize-client');

const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const { OK, BAD_REQUEST } = require('../../../../services/http-status-codes');
const freelancersLogger = require('../../freelancers-logger');

const getDashboardEventList = async (req, res, next) => {
  try {
    const { user } = req;
    let { limit = QUERY_PAGING_MIN_COUNT, startDate, endDate } = req.query;
    const { skip: offset = 0 } = req.query;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    let sqlDataQuery = `(select e.id,e."name", e.start_date as "startDate", e.end_date as "endDate",null as note, 'EVENT' as "type",
    json_build_object(
      'id', c.id, 'name', c."name", 'stateCode', c.state_code, 'countryCode', c.country_code
      ) as cities
      from event_freelancers ef
      inner join events e on e.id = ef.event_id inner join cities c on c.id = e."location"
      where e.status = 'UPCOMING' and (ef.user_id = :userId and ef.is_assigned = true)
      and (e."deleted_at" is null and c."deleted_at" is null and ef."deleted_at" is null)`;

    let replacements = { userId: user.id };

    // for date range queries
    if (startDate && endDate) {
      // If provided endDate is less than startDate
      if (moment(endDate).isBefore(moment(startDate))) {
        throw new ApiError('INVALID_INPUT', BAD_REQUEST);
      }

      // Took start & end of the day
      startDate = moment(startDate).format();
      endDate = moment(endDate).format();

      sqlDataQuery = `${sqlDataQuery} and (e.start_date <= :endDate and e.end_date >= :startDate))
        union all
        (select fc.id,null as name, fc.start_date as "startDate", fc.end_date as "endDate",
        fc.note,'CUSTOM' as "type",
        json_build_object() as cities
        from freelancer_calenders fc where fc.user_id = :userId and fc."deleted_at" is null and fc.event_id is null
        and (fc.start_date <= :endDate and fc.end_date >= :startDate))`;

      replacements = { ...replacements, startDate, endDate };
    } else if (!endDate && startDate) { // for single day event
      // Took start & end of the day
      startDate = moment(startDate).format();
      endDate = moment(startDate).endOf('day').format();

      sqlDataQuery = `${sqlDataQuery} and (e.start_date <= :endDate and e.end_date >= :startDate))
        union all
        (select fc.id,null as name, fc.start_date as "startDate", fc.end_date as "endDate",
        fc.note,'CUSTOM' as "type",
        json_build_object() as cities
        from freelancer_calenders fc where fc.user_id = :userId and fc."deleted_at" is null and fc.event_id is null
        and (fc.start_date <= :endDate and fc.end_date >= :startDate))`;
      replacements = { ...replacements, startDate, endDate };
    } else {
      startDate = moment().startOf('month').format();
      endDate = moment().endOf('month').format();
      sqlDataQuery = `${sqlDataQuery} and (e.start_date <= :endDate and e.end_date >= :startDate))
      union all
      (select fc.id,null as name, fc.start_date as "startDate", fc.end_date as "endDate",fc.note,'CUSTOM' as "type",
      json_build_object() as cities
      from freelancer_calenders fc where fc.user_id = :userId and fc."deleted_at" is null and fc.event_id is null
      and (fc.start_date <= :endDate and fc.end_date >= :startDate))`;
      replacements = { ...replacements, startDate, endDate };
    }

    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as "eventCount"`;

    sqlDataQuery = `${sqlDataQuery} order by "startDate" ASC limit :limit offset :offset`;
    replacements = { ...replacements, limit, offset };

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const dataCount = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    const response = {
      count: parseInt(dataCount[0].count, 10),
      data,
    };

    return sendSuccessResponse(res, 'SUCCESS', OK, response);
  } catch (error) {
    freelancersLogger(`Error from freelancer-get-dashboard-event-list: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getDashboardEventList;
