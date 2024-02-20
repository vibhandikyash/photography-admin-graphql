const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { EVENT_FEES, TRAINING_FEES } = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const freelancerLogger = require('../freelancer-logger');

const sortMapper = {
  recruiterName: 'u.full_name',
  transactionType: 't.transaction_type::text',
  eventName: 'e.name',
  location: 'e.location',
  createdAt: 't.created_at',
};

const listFreelancerWebPayments = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } = {} } } = ctx;

    const {
      where: {
        eventDate: { from: eventStartDate = null, to: eventEndDate = null } = {}, location = null,
        amount: { min: minAmount = 0, max: maxAmount = 0 } = {}, transactionStatus,
        dateOfPayment: { from: transactionStartDate = null, to: transactionEndDate = null } = {},
      } = {},
      filter: { skip: offset = 0, search = '' } = {},
      sort: { sortOn = 'createdAt', sortBy = 'DESC' } = {},
    } = args;

    let { filter: { limit = QUERY_PAGING_MIN_COUNT } = {} } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const replacements = {
      userId,
      offset,
      limit,
      minAmount,
      maxAmount,
      eventFees: EVENT_FEES,
      trainingFees: TRAINING_FEES,
      transactionStatus,
      eventStartDate,
      eventEndDate,
      transactionStartDate,
      transactionEndDate,
      location,
    };

    let sqlDataQuery = `SELECT t.series_no as "seriesNo", e."name" as "eventName", e.start_date as "eventDate", JSONB_BUILD_OBJECT('id', c.id, 'name', c.name) as location, u.full_name as "recruiterName", amount, t.created_at as "dateOfPayment", t.transaction_status as "transactionStatus", t.transaction_type as "transactionType"
    FROM transactions t
      LEFT JOIN events e ON e.id = t.event_id AND e.deleted_at IS NULL
      LEFT JOIN users u ON u.id = e.recruiter_id AND u.deleted_at IS NULL AND u.account_deleted_at IS NULL
      LEFT JOIN cities c on c.id = e."location" AND c.deleted_at IS NULL
    WHERE t.transaction_type IN (:eventFees, :trainingFees) AND t.user_id = :userId AND t.deleted_at IS NULL`;

    if (search) {
      sqlDataQuery += ' AND (u.full_name ILIKE :search OR e.name ILIKE :search)';
      replacements.search = `%${search.trim()}%`;
    }

    if (location && location.length) { sqlDataQuery = ` ${sqlDataQuery} AND e."location" in (:location)`; }
    if (transactionStatus && transactionStatus.length) { sqlDataQuery = `${sqlDataQuery} AND t."transaction_status" in (:transactionStatus)`; }
    if (minAmount && maxAmount) {
      sqlDataQuery = `${sqlDataQuery} AND (t."amount" BETWEEN :minAmount AND :maxAmount)`;
    }
    if (transactionStartDate && transactionEndDate) {
      sqlDataQuery = `${sqlDataQuery} AND (t."created_at" BETWEEN :transactionStartDate AND :transactionEndDate)`;
    }
    if (eventStartDate && eventEndDate) {
      sqlDataQuery = `${sqlDataQuery} AND (e."start_date" BETWEEN :eventStartDate AND :eventEndDate OR e."end_date" BETWEEN :eventStartDate AND :eventEndDate)`;
    }

    const sqlCountQuery = `SELECT CAST(COUNT(*) AS integer) FROM (${sqlDataQuery}) AS paymentsCount`;
    const [{ count = 0 }] = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy} LIMIT :limit OFFSET :offset`;
    const payments = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    const response = { count, data: payments };

    return response;
  } catch (error) {
    freelancerLogger(`Error from listFreelancerWebPayments: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listFreelancerWebPayments;
