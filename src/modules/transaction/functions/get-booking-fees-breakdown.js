const { Sequelize, sequelize } = require('../../../sequelize-client');
const transactionLogger = require('../transaction-logger');

const getBookingFeesBreakdown = async (freelancerId, eventId, groupId, ctx) => {
  try {
    const sqlDataQuery = `select e.name as "event_name",e.start_date,e.end_date,freelancer.full_name as "freelancer_name",t2.transaction_type,ef.finalized_price as "per_day_price",
     date_part('day', e.end_date::timestamp - e.start_date ::timestamp) + 1 as "eventDays",t2.amount as "final_amount",
     (select rr2.meta_data->'updatedNoOfDays' from regularize_requests rr2 where rr2.event_id= e.id and rr2.status = 'APPROVED' and rr2.deleted_at is null order by rr2.created_at desc limit 1) as "updatedEventDays",
     t2.mode_of_transaction as "mode_of_payment"
     from transactions t2
      left join event_freelancers ef on
        ef.event_id = t2.event_id
      left join events e on
        e.id = t2.event_id
      left join users freelancer on
       freelancer.id = t2.user_id
      where (ef.user_id = :freelancerId and t2.user_id = :freelancerId and t2.event_id = :eventId)
      and (t2.transaction_type = 'EVENT_FEES' and  t2.group_id = :groupId)`;
    const replacements = {
      freelancerId, eventId, groupId,
    };

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    return data;
  } catch (error) {
    transactionLogger(`Error while getBookingFeesBreakdown : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getBookingFeesBreakdown;
