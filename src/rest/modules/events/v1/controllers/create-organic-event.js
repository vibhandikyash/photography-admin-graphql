/* eslint-disable max-len */
const { validationResult } = require('express-validator');
const { omit, get } = require('lodash');

const { WEDLANCER_ASSURED } = require('../../../../../constants/service-constants');
const checkExistingCalenderDatesForEvent = require('../../../../../modules/event/functions/check-existing-calender-dates-for-event');

const {
  User: UserModel,
  Event: EventModel,
  EventFreelancer: EventFreelancerModel,
  FreelancerCalender: FreelancerCalenderModel,
  UserBusiness: UserBusinessModel,
  UserProfile: UserProfileModel,
} = require('../../../../../sequelize-client');
const sendEmailForOrganicEnquirySubmitted = require('../../../../../shared-lib/emails/event/send-email-for-organic-enquiry-submitted');
const sendEmailForOrganicEnquirySubmittedToFreelancer = require('../../../../../shared-lib/emails/event/send-email-for-organic-enquiry-submitted-to-freelancer');
const createNotificationForOrganicLeadSubmissionToRecruiter = require('../../../../../shared-lib/notifications/events/create-notification-for-organic-lead-submission-to-recruiter');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const eventLogger = require('../../event-logger');

// TODO: Add validation
const createOrganicEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, 422);
    }
    const { user, body: { startDate, endDate }, localeService } = req;
    // Only approved user are allowed to create leads
    const recruiterInstance = await UserModel.findOne({
      where: { id: user.id, verificationStatus: 'APPROVED' },
    });
    if (!recruiterInstance) throw new ApiError('PROFILE_NOT_VERIFIED', 403);

    const {
      freelancerId,
      name,
      location,
      note,
    } = req.body;

    // ADDED CHECK FOR EXISTING CUSTOM EVENT FOR SELECTED DATES
    const existingCustomEvent = await checkExistingCalenderDatesForEvent(user.id, startDate, endDate);
    if (existingCustomEvent) {
      throw new ApiError(getMessage('EVENT_ALREADY_EXISTS', localeService));
    }

    if (!validateUUID(freelancerId)) throw new ApiError(getMessage('FREELANCER_NOT_FOUND'), 406);

    const freelancer = await UserModel.findOne({
      where: { id: freelancerId, verificationStatus: 'APPROVED', accountDeletedAt: null },
      include: [
        {
          model: UserProfileModel,
          as: 'profile',
          attributes: ['typeKey'],
        },
        {
          model: UserBusinessModel,
          as: 'business',
          attributes: ['pricePerDay'],
        },
      ],
    });
    // If freelancer not found, send error response
    if (!freelancer) throw new ApiError(getMessage('FREELANCER_NOT_FOUND'), 406);

    const organicBooking = {
      createdBy: user.id,
      recruiterId: user.id,
      name,
      startDate,
      endDate,
      location,
      totalBudget: freelancer.business.pricePerDay,
      leadType: 'ORGANIC',
      note,
    };

    organicBooking.freelancers = [{
      userId: freelancerId,
      isRequested: true,
    }];

    const freelancerCalender = {
      userId: user.id,
      startDate: organicBooking.startDate,
      endDate: organicBooking.endDate,
    };

    organicBooking.freelancerCalender = freelancerCalender;
    const event = await EventModel.create(organicBooking, {
      include: [
        {
          model: EventFreelancerModel,
          as: 'freelancers',
          attributes: ['id', 'userId', 'eventId', 'isRequested'],
        },
        {
          model: FreelancerCalenderModel,
          as: 'freelancerCalender',
        },
      ],
      attributes: ['id', 'name', 'startDate', 'endDate', 'location'],
    });

    // send notification when lead is submitted
    if (event) {
      createNotificationForOrganicLeadSubmissionToRecruiter(user.id, event.id, localeService);
    }
    // Remove unnecessary attributes
    let response = JSON.parse(JSON.stringify(event));
    response = omit(response, ['createdAt', 'updatedAt', 'deletedAt']);
    /* eslint-disable no-restricted-syntax */
    for (const eventFreelancer of response.freelancers) {
      delete eventFreelancer.eventId;
      delete eventFreelancer.deletedAt;
      delete eventFreelancer.updatedAt;
      delete eventFreelancer.createdAt;
    }

    // send email to recruiter for organic enquiry
    sendEmailForOrganicEnquirySubmitted(event.id, freelancerId);
    const freelancerTypeKey = get(freelancer, 'profile.typeKey');

    // SEND EMAIL TO THE FREELANCER FOR ORGANIC ENQUIRY
    if (freelancerTypeKey !== WEDLANCER_ASSURED) {
      sendEmailForOrganicEnquirySubmittedToFreelancer(event.id, freelancerId);
    }
    return sendSuccessResponse(res, 'SUCCESS', 201, response);
  } catch (error) {
    eventLogger(`Error from create-organic-event: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = createOrganicEvent;
