/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const moment = require('moment');
const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const {
  RECRUITER, BOOKING_FEES, CONFIGURATION_KEYS: { CONVENIENCE_FEES },
  REFUND, CANCELLATION_CHARGES, COMPLETED, PENDING,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const getBookingFeesBreakdown = require('../functions/get-booking-fees-breakdown');
const getCancellationFeesBreakdown = require('../functions/get-cancellation-fees-breakdown');
const getConvenienceFeesBreakdown = require('../functions/get-convenience-fees-breakdown');
const getRefundBookingFeesBreakDown = require('../functions/get-refund-booking-fees-breakdown');
const getRefundConvenienceFeesBreakDown = require('../functions/get-refund-convenience-fees-breakdown');
const transactionLogger = require('../transaction-logger');

const sortMapper = {
  recruiterName: 'r.full_name',
  contactNo: 'r.contact_no',
  transactionType: 't.transaction_type',
  transactionStatus: 't.transaction_status',
  eventName: 'e.name',
  location: 'e.location',
  createdAt: 't.created_at',
  updatedAt: 't.updated_at',
};

const searchColumns = [
  'e.name',
  'r.full_name',
  'r.contact_no',
  'cast(t.transaction_type as text)',
  'cast(t.transaction_status as text)',
];

const getRecruiterTransactionList = async (_, args, ctx) => {
  try {
    // const { user } = ctx.req;
    let sqlDataQuery;
    let replacements = {};
    const {
      filter: {
        sortOn = 'createdAt', sortBy = 'DESC', skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      }, where,
    } = args;

    sqlDataQuery = `select t.id,e.name as "eventName",e.start_date as "startDate",e.end_date as "endDate",t.user_id as "recruiterId",r.full_name as "recruiterName",r.country_code as "countryCode",r.contact_no as "recruiterContactNo",
    t.event_id as "eventId",t.transaction_type as "transactionType",t.amount,t.transaction_status as "transactionStatus",t."group_id" as "groupId",
    jsonb_build_object( 'id', cp.id,'locationName', cp.name) as location,t.transaction_status as "paymentStatus",t.parent_id as "parentId",t.transaction_sub_type as "transactionSubType",
    t.mode_of_transaction as "modeOfPayment",t.freelancer_id as "freelancerId",t.closing_balance as "updatedBalance",t.created_at as "transactionDate",t.updated_at,t.series_no as "seriesNo"
    from transactions t
    left join events e on
      e.id = t.event_id and e.deleted_at is null
    left join cities cp on
      cp.id = e."location" and cp.deleted_at is null
    left join users r on
      r.id = t."user_id" and r.deleted_at is null
    where
      transaction_type in ('BOOKING_FEES', 'CONVENIENCE_FEES', 'CANCELLATION_CHARGES', 'REFUND', 'WAIVE_OFF','INITIAL_FEES','TOP_UP')
    and r.role = :uRole  and (t.transaction_status in (:completed,:pending)) and t.deleted_at is null`;

    replacements = {
      ...replacements, uRole: RECRUITER, completed: COMPLETED, pending: PENDING,
    };

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

    if (where) {
      if (where.paymentMode && where.paymentMode.length) { sqlDataQuery = `${sqlDataQuery} and t."mode_of_transaction" in (:paymentMode)`; replacements = { ...replacements, paymentMode: where.paymentMode }; }
      if (where.transactionType && where.transactionType.length) { sqlDataQuery = `${sqlDataQuery} and t."transaction_type" in (:transactionType)`; replacements = { ...replacements, transactionType: where.transactionType }; }
      if (where.transactionAmount) {
        const { transactionAmount: { min: minAmount, max: maxAmount } = {} } = where;
        if (minAmount && maxAmount) {
          sqlDataQuery = `${sqlDataQuery} and (t."amount" between :minAmount and :maxAmount)`; replacements = { ...replacements, minAmount, maxAmount };
        }
      }
      if (where.transactionDate) {
        const { transactionDate: { from: startDate, to: endDate } = {} } = where;
        if (endDate && startDate) {
          sqlDataQuery = `${sqlDataQuery} and (t."created_at" between :startDate and :endDate)`;
          replacements = { ...replacements, endDate: moment(endDate).format(), startDate: moment(startDate).format() };
        }
      }
    }

    sqlDataQuery += ' group by t.id,r.id,e.id,cp.id';
    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as usersCount`;

    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy} limit :limit offset :skip`;
    replacements = {
      ...replacements,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
    };

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    for (const transaction of data) {
      if (transaction.transactionType === BOOKING_FEES) {
        transaction.bookingTransactionBreakdown = await getBookingFeesBreakdown(transaction?.freelancerId, transaction?.eventId,
          transaction?.groupId, ctx);
      }

      if (transaction.transactionType === CONVENIENCE_FEES) {
        transaction.convenienceTransactionBreakdown = await getConvenienceFeesBreakdown(transaction?.freelancerId, transaction?.eventId,
          transaction?.groupId, ctx);
      }

      if (transaction.transactionType === REFUND && transaction.transactionSubType === BOOKING_FEES) {
        transaction.bookingFeesRefundTransactionBreakdown = await getRefundBookingFeesBreakDown(transaction?.freelancerId, transaction?.eventId,
          transaction?.parentId, ctx);
      }

      if (transaction.transactionType === REFUND && transaction.transactionSubType === CONVENIENCE_FEES) {
        transaction.convenienceFeesRefundTransactionBreakdown = await getRefundConvenienceFeesBreakDown(transaction?.freelancerId,
          transaction?.eventId, transaction?.parentId, ctx);
      }

      if (transaction.transactionType === CANCELLATION_CHARGES) {
        transaction.cancellationFeesTransactionBreakdown = await getCancellationFeesBreakdown(transaction?.recruiterId,
          transaction?.eventId, ctx);
      }
    }

    const result = {
      count: parseInt(count[0].count, 10),
      data,
    };
    return result;
  } catch (error) {
    transactionLogger(`Error while get recruiter transaction list : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterTransactionList;
