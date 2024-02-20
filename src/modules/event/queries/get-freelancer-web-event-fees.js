const moment = require('moment');

const { WEDLANCER_ASSURED, CANCELLED } = require('../../../constants/service-constants');
const eventPriceBreakDownForFreelancer = require('../../../rest/services/events/event-price-breakdown-for-freelancer');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const getFreelancerWebEventFees = async (_, args, ctx) => {
  try {
    const {
      models: { UserProfile: UserProfileModel, Event: EventModel }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;
    const freelancer = await UserProfileModel.findOne({ where: { userId }, attributes: ['typeKey'] });
    const { typeKey } = freelancer;
    if (typeKey !== WEDLANCER_ASSURED) {
      throw new CustomApolloError(getMessage('UNAUTHORIZED', localeService));
    }

    const event = await EventModel.findByPk(eventId, { attributes: ['startDate', 'endDate', 'status'] });
    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    const { startDate, endDate, status } = event;
    if (status === CANCELLED) {
      throw new CustomApolloError(getMessage('EVENT_FEES_NOT_FOUND', localeService));
    }
    const eventDays = moment(endDate).diff(moment(startDate), 'days') + 1;
    const freelancerEventFees = await eventPriceBreakDownForFreelancer(userId, eventDays, eventId);
    const {
      daysCount, finalizedPrice, deductionAmount, totalPayable,
    } = freelancerEventFees;

    const response = {
      eventDays: daysCount, perDayFees: finalizedPrice, deduction: deductionAmount, totalFees: totalPayable,
    };
    return response;
  } catch (error) {
    eventLogger(`Error from getting freelancer web event fees: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebEventFees;
