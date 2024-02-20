const { Sequelize, sequelize } = require('../../../sequelize-client');
const transactionLogger = require('../transaction-logger');

const getConvenienceFeesBreakdown = async (freelancerId, eventId, groupId, ctx) => {
  try {
    const sqlDataQuery = `select e.start_date,e.end_date,t.transaction_type,count(t.user_id) as "number_of_freelancers",
    (select c.value from configurations c where c.key = 'CONVENIENCE_FEES') as charges,
    date_part('day', e.end_date::timestamp - e.start_date ::timestamp) + 1 as "eventDays",
    (select rr2.meta_data->'updatedNoOfDays' from regularize_requests rr2 where rr2.event_id= e.id and rr2.status = 'APPROVED' and rr2.deleted_at is null order by rr2.created_at desc limit 1) as "updatedEventDays",
    t.amount as "final_amount",
    t.mode_of_transaction as "mode_of_payment"
    from transactions t
      left join events e on
        e.id = t.event_id
      left join event_freelancers ef on
        ef.event_id = t.event_id
    where
      (ef.user_id = :freelancerId and t.freelancer_id = :freelancerId and t.event_id = :eventId)
      and (t.transaction_type = 'CONVENIENCE_FEES' and t.group_id = :groupId)
    group by t.id,e.id
  `;
    const replacements = {
      freelancerId, eventId, groupId,
    };

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    return data;
  } catch (error) {
    transactionLogger(`Error while getConvenienceFeesBreakdown : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getConvenienceFeesBreakdown;
