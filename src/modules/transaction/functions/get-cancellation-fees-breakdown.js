const { Sequelize, sequelize } = require('../../../sequelize-client');
const transactionLogger = require('../transaction-logger');

const getCancellationFeesBreakdown = async (recruiterId, eventId, ctx) => {
  try {
    const sqlDataQuery = `select e.start_date,e.end_date,t.created_at as "cancellation_date",t.meta_data ->> 'totalAmount' as "event_cost",
    t.meta_data ->> 'cancellationPercentage' as "cancellation_percentage",t.amount as "cancellation_charges",t.mode_of_transaction as "mode_of_payment"
    from transactions t
      left join events e on
        e.id = t.event_id
    where (t.event_id = :eventId and t.user_id = :recruiterId)
    and t.transaction_type = 'CANCELLATION_CHARGES'`;
    const replacements = { recruiterId, eventId };

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    return data;
  } catch (error) {
    transactionLogger(`Error while getCancellationFeesBreakdown : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getCancellationFeesBreakdown;
