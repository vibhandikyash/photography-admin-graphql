const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../../../config/config');
const { TOP_UP, SUCCESS } = require('../../../../../constants/service-constants');
const {
  sequelize,
  Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');
const eventLogger = require('../../../events/event-logger');

const getPayments = async (req, res, next) => {
  try {
    let { query: { limit = QUERY_PAGING_MIN_COUNT } } = req;
    const {
      query: { skip: offset = 0 },
      user: { id: userId },
    } = req;

    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const replacements = {
      userId,
      offset,
      limit,
      transactionTypes: [TOP_UP],
    };

    let sqlDataQuery = `
      (
        select u.full_name as "fullName", cast(t.transaction_status as varchar) as "status",t.created_at as "createdAt", t.amount
        from
          transactions t, users u
        where
          t.user_id = :userId and u.id = t.user_id and t.transaction_type in (:transactionTypes) and t.meta_data->>'topUpRequestId' is null
      )
      union all
      (
        select u2.full_name as "fullName", cast(tur.status as varchar) as "status", tur.created_at as "createdAt", tur.amount
        from
          top_up_requests tur, users u2
        where
          u2.id = tur.receiver_id and tur.sender_id = :userId
      )`;

    const sqlCountQuery = `SELECT CAST(count(*) as integer) FROM (${sqlDataQuery}) as usersCount`;
    const [{ count = 0 }] = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    sqlDataQuery += 'order by "createdAt" desc limit :limit offset :offset';
    const payments = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    return sendSuccessResponse(res, SUCCESS, OK, { count, payments });
  } catch (error) {
    eventLogger(`Error from get-payments: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getPayments;
