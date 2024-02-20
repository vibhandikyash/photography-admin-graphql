const {
  SUCCESS, COMPLETED, WAIVE_OFF, REFUND, INITIAL_FEES, TOP_UP,
  EVENT_FEES, CANCELLATION_CHARGES, BOOKING_FEES, CONFIGURATION_KEYS: { CONVENIENCE_FEES },
} = require('../../../constants/service-constants');
const { getMessage } = require('../../../utils/messages');
const recruiterLogger = require('../recruiter-logger');

const CREDIT = [TOP_UP, INITIAL_FEES, REFUND, WAIVE_OFF];
const SPENT = [BOOKING_FEES, CONVENIENCE_FEES, CANCELLATION_CHARGES, EVENT_FEES];

const recruiterDashboardDetails = async (_, args, ctx) => {
  try {
    const { req: { user }, models: { Event: EventModel, Transaction: TransactionModel } } = ctx;
    const {
      models: { UserBusiness: UserBusinessModel },
      localeService,
    } = ctx;

    const [{ totalBalance }, totalSpent, totalCredit] = await Promise.all([
      await UserBusinessModel.findOne({ where: { userId: user.id }, attributes: ['totalBalance'] }),
      await TransactionModel.sum('amount', { where: { userId: user.id, transactionType: SPENT } }),
      await TransactionModel.sum('amount', { where: { userId: user.id, transactionType: CREDIT } }),
    ]);
    const event = EventModel.count({ where: { recruiterId: user.id, status: COMPLETED } });

    const response = {
      status: SUCCESS,
      message: getMessage('RECRUITER_DASHBOARD_DETAILS_FETCHED', localeService),
      data: {
        totalBalance, projectsComplete: event, totalSpent, totalPayments: totalCredit,
      },
    };

    return response;
  } catch (error) {
    recruiterLogger(`Error from get recruiter dashboard details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = recruiterDashboardDetails;
