const moment = require('moment');
const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const {
  FREELANCER, CONFIGURATION_KEYS: { FREELANCER_DEDUCTION_PERCENTAGE }, COMPLETED, PENDING,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { getConfigByKey } = require('../../../shared-lib/configurations');
const transactionLogger = require('../transaction-logger');

const sortMapper = {
  freelancerName: 'f.full_name',
  contactNo: 'f.contact_no',
  transactionType: 't.transaction_type::text',
  transactionStatus: 't.transaction_status',
  eventName: 'e.name',
  location: 'e.location',
  createdAt: 't.created_at',
  updatedAt: 't.updated_at',
};
const searchColumns = [
  'e.name',
  'f.full_name',
  'f.contact_no',
  'cast(t.transaction_type as text)',
  'cast(t.transaction_status as text)',
];

const getFreelancerTransactionList = async (_, args, ctx) => {
  try {
    let sqlDataQuery;
    let replacements = {};
    const {
      filter: {
        sortOn = 'createdAt', sortBy = 'DESC', skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      }, where,
    } = args;

    const [deductionFee] = await getConfigByKey([FREELANCER_DEDUCTION_PERCENTAGE]);

    sqlDataQuery = `select
    distinct t.id,
    f.full_name as "freelancer_name",f.country_code,f.contact_no as "freelancer_contact_no",f.country_code as "country_code",t.transaction_type::text,e.name as "event_name",
    e."location",e.start_date,e.end_date,t.transaction_status as "transaction_status",t.amount,t.created_at as "transaction_date",t.updated_at,t.series_no as "seriesNo",
    case
      when t.transaction_type = 'EVENT_FEES' then
            jsonb_build_object(
              'event_id', e.id,
              'event_name', e.name,
              'per_day_price', ef.finalized_price,
              'eventDays', date_part('day', e.end_date::timestamp - e.start_date ::timestamp) + 1,
              'updatedEventDays', (select rr2.meta_data->'updatedNoOfDays' from regularize_requests rr2 where rr2.event_id= e.id and rr2.status = 'APPROVED' and rr2.deleted_at is null order by rr2.created_at desc limit 1),
              'fees_amount', t.meta_data->'totalAmount',
              'deduction', t.meta_data->'deductionAmount',
              'final_amount', t.amount)
    end as freelancer_breakdown,
    (
    select to_jsonb(location_obj)
    from
      (
        select c.id,c.name as "location_name" from cities c where c.id = e.location and c.deleted_at is null
       ) as location_obj
      ) as location
  from
    "transactions" t
  left join "users" f on
    f."id" = t."user_id" and f.deleted_at is null
  left join "events" e on
    e."id" = t."event_id" and e.deleted_at is null
  left join event_freelancers ef on
    ef.user_id = t.user_id and ef.deleted_at is null
  where
    (f."role" = :uRole
      and ((t.transaction_type = 'EVENT_FEES'
        and e.id = ef.event_id)
      or (t.transaction_type = 'TRAINING_FEES'))
        and (t.transaction_status in (:completed,:pending))) and t.deleted_at is null`;

    replacements = {
      ...replacements, uRole: FREELANCER, deductionFee, completed: COMPLETED, pending: PENDING,
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
      if (where.location && where.location.length) { sqlDataQuery = `${sqlDataQuery} and e."location" in (:location)`; replacements = { ...replacements, location: where.location }; }
      if (where.transactionStatus && where.transactionStatus.length) { sqlDataQuery = `${sqlDataQuery} and t."transaction_status" in (:transactionStatus)`; replacements = { ...replacements, transactionStatus: where.transactionStatus }; }
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

    sqlDataQuery += ' group by t.id,f.id,e.id,ef.id';
    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as usersCount`;

    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy} limit :limit offset :skip`;
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
    return result;
  } catch (error) {
    transactionLogger(`Error while get freelancer transaction list : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerTransactionList;
