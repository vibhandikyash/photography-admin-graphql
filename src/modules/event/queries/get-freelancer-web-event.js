const { get } = require('lodash');

const {
  WEDLANCER_ASSURED, COMPLETED, PENDING, EVENT_FEES,
} = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const getFreelancerWebEvent = async (_, args, ctx) => {
  try {
    const {
      models: {
        Event: EventModel, EventTiming: EventTimingModel, UserProfile: UserProfileModel, Transaction: TransactionModel,
      }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;
    const existingEvent = await EventModel.findByPk(eventId);
    if (!existingEvent) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    const freelancer = await UserProfileModel.findOne({ where: { userId }, attributes: ['typeKey'] });
    const { typeKey } = freelancer;
    const includeOptions = [];
    let attributes = ['id', 'name', 'createdBy', 'recruiterId', 'startDate', 'endDate', 'location', 'leadType', 'status', 'note', 'createdAt',
      'cancelledBy'];

    if (typeKey === WEDLANCER_ASSURED) {
      attributes = ['id', 'name', 'createdBy', 'recruiterId', 'assignedTo', 'startDate', 'endDate',
        'location', 'totalBudget', 'isAssigned', 'leadType', 'status', 'note', 'createdAt', 'cancelledBy'];
      includeOptions.push(
        {
          model: EventTimingModel,
          as: 'timings',
          attributes: ['id', 'startDate', 'endDate'],
        },
        {
          model: TransactionModel,
          as: 'transactions',
          where: { userId, transactionStatus: [COMPLETED, PENDING], transactionType: EVENT_FEES },
          attributes: ['id', 'transactionStatus', 'amount'],
          required: false,
        },
      );
    }
    const event = await EventModel.findByPk(eventId, { attributes, include: includeOptions });
    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    if (typeKey === WEDLANCER_ASSURED) {
      const { transactions } = event;
      event.transaction = get(transactions, '[0]');
    }
    return event;
  } catch (error) {
    eventLogger(`Error from getting freelancer web event: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebEvent;
