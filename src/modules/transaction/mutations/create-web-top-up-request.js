const { map } = require('lodash');

const { FREELANCER, PENDING, SUCCESS } = require('../../../constants/service-constants');
const isDeletedUser = require('../../../rest/services/users/is-deleted-user');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const transactionLogger = require('../transaction-logger');

const createWebTopUpRequest = async (_, args, ctx) => {
  try {
    const {
      data: {
        amount, freelancerId, modeOfPayment, note,
      } = {},
      where: { id: eventId = null } = {},
    } = args;
    const {
      req: { user: { id: userId } }, models: {
        TopUpRequest: TopUpRequestModel, Event: EventModel,
        EventFreelancer: EventFreelancerModel,
      }, localeService,
    } = ctx;

    const { isDeleted, userInstance } = await isDeletedUser(freelancerId);

    if (isDeleted || userInstance.role !== FREELANCER) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }

    const eventInstance = await EventModel.findByPk(eventId,
      {
        where: { recruiterId: userId },
        attributes: ['id', 'recruiterId'],
        include: {
          model: EventFreelancerModel,
          as: 'freelancers',
          where: { isAssigned: true },
          attributes: ['userId'],
          required: false,
        },
      });

    if (!eventInstance || eventInstance.recruiterId !== userId) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const eventFreelancerIds = map(eventInstance.freelancers, 'userId');
    if (!eventFreelancerIds.includes(freelancerId)) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_SEND_REQUEST', localeService));
    }

    const data = {
      eventId,
      senderId: userId,
      amount,
      note,
      receiverId: freelancerId,
      modeOfPayment,
      status: PENDING,
    };
    await TopUpRequestModel.create(data);
    const response = { status: SUCCESS, message: getMessage('TOP_REQUEST_CREATED_SUCCESSFULLY') };
    return response;
  } catch (error) {
    transactionLogger(`Error from createWebTopUpRequest: ${error}`, ctx, 'error');
    throw error;
  }
};
module.exports = createWebTopUpRequest;
