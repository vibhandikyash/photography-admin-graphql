/* eslint-disable max-len */
const moment = require('moment');

const { issueRaiseMaxHours } = require('../../../../../constants/constants');
const {
  Event: EventModel,
  UserProfile: UserProfileModel,
  EventFreelancer: EventFreelancerModel,
  Dispute: DisputeModel,
} = require('../../../../../sequelize-client');
const sendEmailForDisputeRaised = require('../../../../../shared-lib/emails/dispute/send-email-for-dispute-raised');
const createNotificationForDisputeRaisedAgainstRecruiter = require('../../../../../shared-lib/notifications/disputes/create-notification-for-dispute-raised-against-recruiter');

const createNotificationForDisputeRaisedToAdmin = require('../../../../../shared-lib/notifications/disputes/create-notification-for-dispute-raised-to-admin');
const { sendSuccessResponse } = require('../../../../../utils/create-error');

const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const getNextTicketNo = require('../../../../services/get-next-ticket-no');
const {
  BAD_REQUEST, INVALID_INPUT, OK, NOT_FOUND, FORBIDDEN,
} = require('../../../../services/http-status-codes');
const eventLogger = require('../../../events/event-logger');

const createFreelancerEventIssue = async (req, res, next) => {
  try {
    const { user, localeService } = req;
    const { eventId, message } = req.body;

    if (!validateUUID(eventId)) throw new ApiError('INVALID_INPUT', INVALID_INPUT);
    const profile = await UserProfileModel.findOne({
      where: {
        userId: user.id,
      },
    });

    // Only WEDLANCER_ASSURED user are allowed to raised issues.
    if (!profile?.typeKey === 'WEDLANCER_ASSURED') throw new ApiError('ISSUE_RAISE_NOT_ALLOWED', FORBIDDEN);

    const event = await EventModel.findByPk(eventId);
    if (!event) throw new ApiError('EVENT_NOT_FOUND', NOT_FOUND);

    // Only completed event are allowed to be raised issues
    if (event.status !== 'COMPLETED') throw new ApiError('EVENT_NOT_COMPLETED', BAD_REQUEST);

    // USer can't raise issue after certain period
    const completedAt = moment(event.endDate, 'YYYY-MM-DD HH:mm:ss');
    const completedDiff = moment().diff(completedAt, 'hours');
    if (completedDiff > issueRaiseMaxHours) throw new ApiError('CANT_RAISE_ISSUE_AFTER_24HR', FORBIDDEN);

    // Issue only raised to by user who have assigned to this event
    const freelancer = await EventFreelancerModel.count({
      where: {
        eventId,
        userId: user.id,
        isAssigned: true,
      },
    });
    if (!freelancer) throw new ApiError('ISSUE_RAISE_NOT_ALLOWED', FORBIDDEN);

    // Freelancer is only raised issue once to a event
    const prevIssue = await DisputeModel.count({
      where: {
        raisedBy: user.id,
        eventId,
      },
    });
    if (prevIssue) throw new ApiError('ALREADY_ISSUE_RAISED', BAD_REQUEST);

    // get the last ticket number & generate a next issue number
    const ticketNo = await getNextTicketNo();
    const dispute = await DisputeModel.create({
      eventId,
      userId: event.recruiterId,
      message,
      ticketNo,
      raisedBy: user.id,
    });

    const response = JSON.parse(JSON.stringify(dispute));
    delete response.createdAt;
    delete response.updatedAt;
    delete response.deletedAt;

    // SEND PUSH NOTIFICATION
    if (dispute) {
      sendEmailForDisputeRaised(dispute.id);
      createNotificationForDisputeRaisedAgainstRecruiter(user.id, event.recruiterId, dispute, localeService);
      createNotificationForDisputeRaisedToAdmin(dispute.id, localeService);
    }

    return sendSuccessResponse(res, 'SUCCESS', OK, response);
  } catch (error) {
    eventLogger(`Error from freelancer-create-event-issue: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = createFreelancerEventIssue;
