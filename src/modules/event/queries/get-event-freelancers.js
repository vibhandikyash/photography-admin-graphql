const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const getEventFreelancers = async (_, args, ctx) => {
  try {
    const {
      models: {
        Event: EventModel, EventFreelancer: EventFreelancerModel, User: UserModel, UserProfile: UserProfileModel,
      }, localeService,
    } = ctx;

    const { filter: { skip: offset = 0 }, where } = args;
    let { filter: { limit = QUERY_PAGING_MIN_COUNT } } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);
    const { eventId } = where;

    const event = await EventModel.findByPk(eventId);
    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const condition = { eventId, isAssigned: true };
    let freelancerTypeCondition;
    if (where.freelancerType) {
      const { freelancerType } = where;
      freelancerTypeCondition = { typeKey: freelancerType };
    }
    const includeOptions = [{
      model: UserModel,
      as: 'eventFreelancers',
      attributes: ['id', 'fullName', 'email', 'userName', 'contactNo', 'verificationStatus', 'countryCode', 'isActive'],
      where: { accountDeletedAt: null },
      include: {
        model: UserProfileModel,
        as: 'profile',
        attributes: ['profilePhoto', 'typeKey'],
        where: freelancerTypeCondition,
      },
    }];

    const freelancers = await EventFreelancerModel.findAll({
      where: condition,
      required: true,
      include: includeOptions,
      limit,
      offset,
    });
    const count = await EventFreelancerModel.count({ where: condition });
    const response = { count, data: freelancers };
    return response;
  } catch (error) {
    eventLogger(`Error from getting event freelancers: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getEventFreelancers;
