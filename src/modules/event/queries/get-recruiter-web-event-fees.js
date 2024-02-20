/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const moment = require('moment');

const {
  WEDLANCER_ASSURED, CANCELLED, COMPLETED, PENDING, EVENT_FEES, COMMISSION, PREMIUM, FREE, CONFIGURATION_KEYS: { CONVENIENCE_FEES },
} = require('../../../constants/service-constants');
const { getConfigByKey } = require('../../../shared-lib/configurations');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const getRecruiterWebEventFees = async (_, args, ctx) => {
  try {
    const {
      models: {
        UserProfile: UserProfileModel, Event: EventModel,
        EventFreelancer: EventFreelancerModel, Transaction: TransactionModel,
      }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;

    const event = await EventModel.findByPk(eventId, { attributes: ['startDate', 'endDate', 'status', 'recruiterId'] });
    if (!event || event.recruiterId !== userId) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    const { startDate, endDate, status } = event;
    if (status === CANCELLED) {
      throw new CustomApolloError(getMessage('EVENT_FEES_NOT_FOUND', localeService));
    }

    const eventDays = moment(endDate).diff(moment(startDate), 'days') + 1;
    const freelancers = await EventFreelancerModel.findAll({ where: { eventId, isAssigned: true } });

    const [freelancerConvenienceFee] = await getConfigByKey([CONVENIENCE_FEES]);
    const convenienceFees = freelancerConvenienceFee * eventDays * freelancers.length;
    const freelancersPrice = [];

    for (const freelancer of freelancers) {
      let price;
      const { userId: freelancerId, isAssigned } = freelancer;
      const freelancerProfile = await UserProfileModel.findOne({ where: { userId: freelancerId }, attributes: ['typeKey'] });
      const { typeKey } = freelancerProfile;
      if (typeKey === PREMIUM || typeKey === FREE) {
        const { finalizedPrice } = freelancer;
        const eventAmount = finalizedPrice * eventDays;
        price = { finalizedPrice: eventAmount, userId: freelancerId };
      }
      if (typeKey === WEDLANCER_ASSURED) {
        const eventFees = await TransactionModel.findOne({
          where: {
            userId: freelancerId,
            transactionStatus: [COMPLETED, PENDING],
            transactionType: EVENT_FEES,
            eventId,
          },
        });

        const commission = await TransactionModel.findOne({
          where: {
            freelancerId,
            transactionStatus: [COMPLETED, PENDING],
            transactionType: COMMISSION,
            eventId,
          },
        });
        if (eventFees && commission) {
          const { amount: eventFeesAmount } = eventFees;
          const { amount: commissionFeesAmount } = commission;
          price = { finalizedPrice: eventFeesAmount + commissionFeesAmount, userId: freelancerId, isAssigned };
        }
      }
      freelancersPrice.push(price);
    }
    const response = {
      eventDays, freelancersCount: freelancers.length, convenienceFees, freelancers: freelancersPrice,
    };
    return response;
  } catch (error) {
    eventLogger(`Error from getting recruiter web event fees: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterWebEventFees;
