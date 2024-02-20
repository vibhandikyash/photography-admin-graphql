const { map } = require('lodash');
const Sequelize = require('sequelize');

const { CONFIGURATION_KEYS: { CONVENIENCE_FEES } } = require('../../../constants/service-constants');
const { sequelize } = require('../../../sequelize-client');
const { getConfigByKey } = require('../../../shared-lib/configurations');
const transactionLogger = require('../transaction-logger');

const getTransactionDetailsForEvent = async (_, args, ctx) => {
  try {
    let sqlDataQuery;
    let replacements = {};
    const { eventId } = args;

    sqlDataQuery = `select
    distinct on
    (e.id)
    e.name as event_name,
    (date_part('day', e.end_date::timestamp - e.start_date ::timestamp) + 1) as number_of_days_of_event,
    count(ef.id) as number_of_freelancers,
    ((date_part('day', e.end_date::timestamp - e.start_date ::timestamp) + 1) * (count(ef.id)) * :charges) as convenience_fees,
    (
    select
      jsonb_agg(freelancer_breakdown) as "freelancer_breakdown"
    from
      (
      select
        fl.full_name as freelancer_name,
        ef.finalized_price * (date_part('day', e.end_date::timestamp-e.start_date ::timestamp) + 1) as final_amount,
        c."name" as freelancer_category
      ) as freelancer_breakdown
    ) as "freelancerBreakdown"
  from
    transactions t
  left join events e on
     e.id = t.event_id
  left join event_freelancers ef on
      ef.user_id = t.user_id
  left join users fl on
       fl.id = ef.user_id
  left join user_businesses ub on
       ub.user_id = ef.user_id
  left join categories c on
      c.id = ub.category_id
  where
    t.event_id = :eventId`;

    const [convenienceCharges] = await getConfigByKey([CONVENIENCE_FEES]);
    replacements = { ...replacements, eventId, charges: convenienceCharges };

    sqlDataQuery += ' group by e.id,ef.id,fl.id,c.id';

    replacements = {
      ...replacements,
    };

    const [data] = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    let totalPayableAmount;
    if (data.freelancerBreakdown.length) {
      const finalAmountOfAllFreelancers = map(data.freelancerBreakdown, 'final_amount');
      totalPayableAmount = finalAmountOfAllFreelancers.reduce((previousValue, currentValue) => previousValue + currentValue);
    }
    const { convenience_fees: convenienceFees } = data;
    data.totalPayableAmount = totalPayableAmount + convenienceFees;

    return data;
  } catch (error) {
    transactionLogger(`Error while get transaction details for event : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getTransactionDetailsForEvent;
