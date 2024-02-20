const { Sequelize, sequelize } = require('../../../sequelize-client');
const transactionLogger = require('../transaction-logger');

const getRefundBookingFeesBreakDown = async (freelancerId, eventId, parentId, ctx) => {
  try {
    const sqlDataQuery = `select e.start_date,e.end_date,cf.full_name as "cancelled_freelancer",t.amount as "cancelled_freelancer_fees",
    t.mode_of_transaction as "mode_of_payment"
    from transactions t
      left join event_freelancers cef on
        cef.event_id = t.event_id
      left join events e on
        e.id = t.event_id
      left join users cf on
        cf.id = t.freelancer_id
    where
      cef.user_id = :freelancerId and (t.freelancer_id = :freelancerId
        and t.event_id = :eventId and t.parent_id = :parentId)
      and (t.transaction_type = 'REFUND' and t.transaction_sub_type = 'BOOKING_FEES' and t.transaction_status = 'COMPLETED')`;
    const replacements = { freelancerId, eventId, parentId };

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    return data;
  } catch (error) {
    transactionLogger(`Error while getRefundBookingFeesBreakDown : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRefundBookingFeesBreakDown;
