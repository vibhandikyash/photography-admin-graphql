const moment = require('moment');

const {
  COMPLETED, EVENT_RAISE_DISPUTE_VALIDITY_IN_HOURS, WEDLANCER_ASSURED, SUCCESS,
} = require('../../../constants/service-constants');
const getNextTicketNo = require('../../../rest/services/get-next-ticket-no');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const disputeLogger = require('../dispute-logger');

const createRecruiterDispute = async (_, args, ctx) => {
  try {
    const {
      models: {
        Event: EventModel, UserProfile: UserProfileModel, EventFreelancer: EventFreelancerModel, Dispute: DisputeModel,
      },
      req: { user: { id: userId } }, localeService,
    } = ctx;
    const { data = {}, where: { id: eventId = null } } = args;

    const freelancerProfile = await UserProfileModel.findOne({ where: { userId }, attributes: ['typeKey'] });
    const { typeKey: freelancerTypeKey } = freelancerProfile;
    if (freelancerTypeKey !== WEDLANCER_ASSURED) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_RAISE_ISSUE'), localeService);
    }

    const event = await EventModel.findByPk(eventId);
    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND'), localeService);
    }

    const freelancer = await EventFreelancerModel.findOne({ where: { eventId, userId, isAssigned: true } });
    if (!freelancer) {
      throw new CustomApolloError('NOT_ALLOWED_TO_RAISE_ISSUE', localeService);
    }

    const { status, endDate, recruiterId } = event;
    if (status !== COMPLETED) {
      throw new CustomApolloError('NOT_ALLOWED_TO_RAISE_ISSUE_BEFORE_EVENT_COMPLETION', localeService);
    }

    const completedAt = moment(endDate);
    const completedDiff = moment().diff(completedAt, 'hours');
    if (completedDiff > EVENT_RAISE_DISPUTE_VALIDITY_IN_HOURS) {
      throw new CustomApolloError(getMessage('ISSUE_RAISE_VALIDITY', localeService, {
        disputeRaiseValidityInDays: EVENT_RAISE_DISPUTE_VALIDITY_IN_HOURS,
      }));
    }

    const existingDispute = await DisputeModel.findOne({ where: { userId: recruiterId, raisedBy: userId, eventId } });
    if (existingDispute) {
      throw new CustomApolloError(getMessage('ISSUE_IS_ALREADY_RAISED'), localeService);
    }

    const ticketNo = await getNextTicketNo();
    const { message = null } = data;
    const disputeData = {
      eventId, userId: recruiterId, message, ticketNo, raisedBy: userId,
    };
    await DisputeModel.create(disputeData);
    const response = { status: SUCCESS, message: getMessage('ISSUE_RAISED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    disputeLogger(`Error while creating recruiter dispute from web : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createRecruiterDispute;
