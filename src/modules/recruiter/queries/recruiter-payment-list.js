const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { TOP_UP } = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const recruiterLogger = require('../recruiter-logger');

const recruiterPaymentList = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } = {} } } = ctx;

    const {
      where: { amount: { min: minAmount = 0, max: maxAmount = 0 } = {}, date: { from = null, to = null } = {}, transactionStatus = [] } = {},
      filter: { skip: offset = 0, search = '' } = {},
    } = args;

    let { filter: { limit = QUERY_PAGING_MIN_COUNT } = {} } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const replacements = {
      userId, offset, limit, transactionTypes: [TOP_UP], searchValue: `%${search}%`, minAmount, maxAmount, from, to, transactionStatus,
    };

    let sqlDataQuery = `
    select * from ((
      select u.full_name as "fullName", cast(t.transaction_status as varchar) as "status",t.created_at as "createdAt", t.amount
      from
        transactions t, users u
      where
        t.user_id = :userId and u.id = t.user_id and t.transaction_type in (:transactionTypes) and t.meta_data->>'topUpRequestId' is null
    )
    union all
    (
      select u.full_name as "fullName", cast(t.status as varchar) as "status", t.created_at as "createdAt", t.amount
      from
        top_up_requests t, users u
      where
        u.id = t.receiver_id and t.sender_id = :userId
    )) as data where 1=1`;
    if (search) {
      sqlDataQuery = `${sqlDataQuery} AND data."fullName" ILIKE :searchValue`;
    }

    if (minAmount && maxAmount) {
      sqlDataQuery = `${sqlDataQuery} AND data.amount BETWEEN :minAmount AND :maxAmount `;
    }

    if (from && to) {
      sqlDataQuery = `${sqlDataQuery} AND data."createdAt" BETWEEN :from AND :to`;
    }

    if (transactionStatus.length) {
      sqlDataQuery = `${sqlDataQuery} AND data."status" in (:transactionStatus)`;
    }
    const sqlCountQuery = `SELECT CAST(COUNT(*) AS integer) FROM (${sqlDataQuery}) AS paymentsCount`;
    const [{ count = 0 }] = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    sqlDataQuery += ' ORDER BY "createdAt" DESC LIMIT :limit OFFSET :offset';
    const payments = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    const response = { count, data: payments };

    return response;
  } catch (error) {
    recruiterLogger(`Error from recruiterPaymentList: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = recruiterPaymentList;
