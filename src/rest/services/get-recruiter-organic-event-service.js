/* eslint-disable max-lines */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const moment = require('moment');

const { WEDLANCER_ASSURED, APPROVED, CANCELLED } = require('../../constants/service-constants');

const {
  models: {
    Event: EventModel, City: CityModel, Dispute: DisputeModel, UserProfile: UserProfileModel, UserReview: UserReviewModel,
    Category: CategoryModel, EventTiming: EventTimingModel, User: UserModel, UserBusiness: UserBusinessModel, EventFreelancer: EventFreelancerModel,
  },
} = require('../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../shared-lib/aws/functions/generate-url-for-keys');

const { getMessage } = require('../../utils/messages');
const eventLogger = require('../modules/events/event-logger');

const { ApiError } = require('./custom-api-error');
const eventPriceBreakDownForRecruiter = require('./events/event-price-breakdown-for-recruiter');
const reviewsRatingsDataParser = require('./events/reviews-ratings-data-parser');
const getUserAttendanceLogs = require('./recruiters/get-user-attendance-logs');

const getRecruiterOrganicEventService = async (user, eventId) => {
  try {
    const includeOptions = [
      {
        model: EventFreelancerModel,
        as: 'freelancers',
        attributes: ['id', 'userId', 'isAssigned', 'finalizedPrice', 'isRequested', 'createdAt'],
        include: [
          {
            model: UserModel,
            as: 'eventFreelancers',
            attributes: ['id', 'fullName', 'email', 'countryCode', 'contactNo', 'role'],
            include: [
              {
                model: UserBusinessModel,
                as: 'business',
                attributes: ['projectsComplete'],
                include: [{
                  model: CategoryModel,
                  as: 'userCategory',
                  attributes: ['name'],
                }],
              },
              {
                model: UserProfileModel,
                as: 'profile',
                attributes: ['typeKey', 'profilePhoto'],
              },
              {
                model: UserReviewModel,
                where: { eventId },
                as: 'reviewFor',
                required: false,
                attributes: ['userId', 'reviewerId', 'overAllRating', 'communicationRating', 'punctualityRating', 'review'],
              },
              {
                model: UserReviewModel,
                as: 'reviewCreator',
                where: { eventId, status: APPROVED },
                required: false,
                attributes: ['userId', 'reviewerId', 'overAllRating', 'communicationRating', 'punctualityRating', 'review'],
              },
            ],
          },
        ],
      },
      {
        model: CityModel,
        as: 'cities',
        attributes: ['id', 'name', 'stateCode', 'countryCode'],
      },
      {
        model: UserModel,
        as: 'cancelledByUser',
        attributes: ['id', 'fullName', 'countryCode', 'contactNo', 'role'],
      },
      {
        model: UserModel,
        as: 'assignee',
        attributes: ['id', 'fullName', 'countryCode', 'contactNo'],
      },
      {
        model: EventTimingModel,
        as: 'timings',
        attributes: ['startDate', 'endDate'],
      },
      {
        model: DisputeModel,
        as: 'eventIssue',
        where: {
          raisedBy: user.id,
        },
        required: false,
        attributes: ['id', 'ticketNo', 'eventId', 'userId', 'raisedBy', 'message', 'resolution', 'status', 'createdAt'],
      },
    ];

    const options = {
      where: { id: eventId, recruiterId: user.id },
      attributes: ['id', 'name', 'status', 'leadType', 'startDate',
        'totalBudget', 'assignedTo', 'isAssigned', 'cancelledBy', 'endDate', 'createdAt'],
      include: includeOptions,
      order: [[{ model: EventTimingModel, as: 'timings' }, 'startDate', 'ASC']],
    };
    const leads = await EventModel.findOne(options);

    if (!leads) {
      throw new ApiError(getMessage('EVENT_NOT_FOUND_FOR_LOGGED_IN_USER'), 404);
    }

    // remove unnecessary attributes
    const response = JSON.parse(JSON.stringify(leads));

    if (response.status !== 'COMPLETED') delete response.reviews;

    // Get only assigned freelancers
    const assignedFreelancer = response.freelancers.filter(freelancer => freelancer.isAssigned === true);

    if (assignedFreelancer.length) {
      response.freelancers = assignedFreelancer;
    }
    // Freelancers unnecessary attributes;
    for (const freelancer of response.freelancers) {
      freelancer.user = freelancer.eventFreelancers;
      const { typeKey } = freelancer.user.profile;

      if (freelancer?.user?.profile?.profilePhoto) {
        [freelancer.user.profile.profilePhoto] = await getKeysAndGenerateUrl([freelancer.user.profile.profilePhoto]);
      }

      freelancer.user.category = freelancer.eventFreelancers?.business?.userCategory?.name;

      if (typeKey === WEDLANCER_ASSURED) {
        let attendanceLogs = await getUserAttendanceLogs(freelancer?.user?.id, response.id);
        attendanceLogs = attendanceLogs?.map(attendance => {
          const { eventTimings } = attendance;
          delete attendance.eventTimings;
          attendance = { ...attendance, ...eventTimings };
          return attendance;
        });
        freelancer.user.attendance = attendanceLogs;
      }

      // Reviews is only for WEDLANCER_ASSURED type user

      if (typeKey === WEDLANCER_ASSURED && response.status === 'COMPLETED') {
        const { reviewFor, reviewCreator } = freelancer.eventFreelancers;
        const reviewsData = [...reviewFor, ...reviewCreator];
        const reviews = await reviewsRatingsDataParser(reviewsData, freelancer);
        freelancer.user.reviews = reviews;
        await response.eventIssue?.forEach(e => {
          if (e?.userId === freelancer?.user?.id) {
            freelancer.issue = {
              ticketNo: e.ticketNo,
              message: e.message,
              status: e.status,
              resolution: e.resolution,
              createdAt: e.createdAt,
            };
          }
        });
      }

      // delete the review object
      delete freelancer.user.reviewFor;
      delete freelancer.user.reviewCreator;
      delete freelancer.user.issueCreator;

      delete freelancer.eventFreelancers;
      delete freelancer.userId;
      delete freelancer.userId;
      delete freelancer.user?.business;
    }

    if (response.cancelledByUser?.id === user.id) {
      response.cancelledBy = 'YOU';
    } else {
      response.cancelledBy = response.cancelledByUser?.role;
    }
    delete response.cancelledByUser;

    // price breakdown
    if (assignedFreelancer.length && response.status !== CANCELLED) {
      const daysCount = moment(response.endDate).diff(moment(response.startDate), 'days') + 1;
      const priceBreakdown = await eventPriceBreakDownForRecruiter(user.id, assignedFreelancer, eventId, daysCount);
      response.priceBreakdown = priceBreakdown;
    }

    delete response.eventIssue;
    delete response.reviews;
    delete response.assignedTo;
    delete response.isAssigned;

    if (response.status === 'CANCELLED') {
      delete response?.freelancers;
      delete response?.assignee;
      delete response?.eventIssue;
      delete response?.timings;
    }

    return response;
  } catch (error) {
    eventLogger(`Error from get-recruiter-event-service: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = getRecruiterOrganicEventService;
