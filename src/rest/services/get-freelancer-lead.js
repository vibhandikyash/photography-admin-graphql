/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable max-lines */
const { orderBy, get } = require('lodash');
const moment = require('moment');
const { Op } = require('sequelize');

const {
  WEDLANCER_ASSURED, PREMIUM, FREE, APPROVED, CANCELLED,
} = require('../../constants/service-constants');

const {
  models: {
    Event: EventModel, Dispute: DisputeModel, UserReview: UserReviewModel, UserProfile: UserProfileModel, EventTiming: EventTimingModel,
    User: UserModel, City: CityModel, Transaction: TransactionModel, EventFreelancer: EventFreelancerModel, UserBusiness: UserBusinessModel,
    Category: CategoryModel,
  },
} = require('../../sequelize-client');
const { getMessage } = require('../../utils/messages');
const eventLogger = require('../modules/events/event-logger');

const { ApiError } = require('./custom-api-error');
const eventPriceBreakDownForFreelancer = require('./events/event-price-breakdown-for-freelancer');
const reviewsRatingsDataParser = require('./events/reviews-ratings-data-parser');
const getUserAttendanceLogs = require('./recruiters/get-user-attendance-logs');

const getFreelancerEventDetails = async (userId, eventId, freelancerType = 'FREE') => {
  try {
    const typeCondition = freelancerType !== PREMIUM && freelancerType !== FREE
      ? [{
        model: TransactionModel,
        as: 'transactions',
        attributes: ['transactionStatus'],
        where: { eventId, transactionType: 'EVENT_FEES' },
        required: false,
      }] : [];

    const includeOptions = [
      {
        model: EventFreelancerModel,
        as: 'freelancers',
        where: { userId, isAssigned: true },
        attributes: ['id', 'userId', 'finalizedPrice', 'isAssigned'],
        include: [
          {
            model: UserModel,
            as: 'eventFreelancers',
            attributes: ['id', 'fullName', 'email', 'countryCode', 'contactNo', 'role'],
            include: [
              {
                model: UserBusinessModel,
                as: 'business',
                attributes: ['id'],
                include: [{
                  model: CategoryModel,
                  as: 'userCategory',
                  attributes: ['name'],
                }],
              },
              {
                model: UserProfileModel,
                as: 'profile',
                attributes: ['typeKey'],
              },
              ...typeCondition,
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
        as: 'creator',
        attributes: ['id', 'fullName', 'countryCode', 'contactNo', 'role'],
      },
      {
        model: UserModel,
        as: 'recruiter',
        attributes: ['id', 'fullName', 'countryCode', 'contactNo'],
      },
      {
        model: UserModel,
        as: 'cancelledByUser',
        attributes: ['id', 'fullName', 'countryCode', 'contactNo', 'role'],
      },
    ];

    if (freelancerType === WEDLANCER_ASSURED) {
      includeOptions.push(
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
          model: UserReviewModel,
          as: 'reviews',
          required: false,
          where: {
            [Op.or]: [
              { reviewerId: userId },
              { userId, status: APPROVED },
            ],
          },
          attributes: ['userId', 'reviewerId', 'review', 'overAllRating', 'communicationRating', 'punctualityRating'],
          include: [
            {
              model: UserModel,
              as: 'user',
              attributes: ['fullName', 'role'],
            },
            {
              model: UserModel,
              as: 'reviewer',
              attributes: ['fullName', 'role'],
            },
          ],
        },
        {
          model: DisputeModel,
          as: 'eventIssue',
          where: {
            raisedBy: userId,
          },
          required: false,
          attributes: ['id', 'ticketNo', 'eventId', 'userId', 'raisedBy', 'message', 'resolution', 'status', 'createdAt'],
        },
      );
    }

    const orderByCondition = freelancerType === WEDLANCER_ASSURED
      ? [[{ model: EventTimingModel, as: 'timings' }, 'startDate', 'ASC']] : [];

    const options = {
      attributes: ['id', 'name', 'status', 'leadType', 'note',
        'startDate', 'endDate', 'createdAt', 'totalBudget', 'assignedTo', 'cancelledBy'],
      include: includeOptions,
      order: orderByCondition,
    };
    const lead = await EventModel.findByPk(eventId, options);

    if (!lead) {
      throw new ApiError(getMessage('EVENT_NOT_FOUND_FOR_LOGGED_IN_USER'), 404);
    }
    // remove unnecessary attributes
    const response = JSON.parse(JSON.stringify(lead));

    // Get only assigned freelancers
    const assignedFreelancer = response.freelancers.filter(freelancer => freelancer.isAssigned === true);

    // Freelancers unnecessary attributes;
    for (const freelancer of response.freelancers) {
      freelancer.user = freelancer.eventFreelancers;
      freelancer.user.category = freelancer.eventFreelancers?.business?.userCategory?.name;
      const { transactions } = freelancer.eventFreelancers;
      transactions?.forEach(transactionObj => {
        freelancer.user.transactionStatus = transactionObj.transactionStatus;
      });
      delete freelancer.eventFreelancers.transactions;

      // attendance logs for wedlancer assured
      if (freelancerType === WEDLANCER_ASSURED) {
        let attendanceLogs = await getUserAttendanceLogs(freelancer?.user?.id, response.id);
        attendanceLogs = attendanceLogs?.map(attendance => {
          const { eventTimings } = attendance;
          const regularizeRequestStatus = get(eventTimings, 'regularizeRequests[0].status');

          delete eventTimings.regularizeRequests;
          delete attendance.eventTimings;

          attendance = {
            ...attendance,
            ...eventTimings,
            regularizeRequestStatus,
          };
          return attendance;
        });
        freelancer.user.attendance = attendanceLogs;
      }

      // Reviews is only for WEDLANCER_ASSURED type user
      if (response.status === 'COMPLETED' && freelancerType === WEDLANCER_ASSURED) {
        // get reviews and ratings
        let reviews = await reviewsRatingsDataParser(response.reviews, freelancer);
        reviews = orderBy(reviews, 'ratedTo', 'desc');
        freelancer.user.reviews = reviews;

        await response.eventIssue?.forEach(e => {
          if (e.raisedBy === userId) {
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

      if (freelancerType !== WEDLANCER_ASSURED) {
        delete response.timings;
      }
      delete freelancer.user?.business;
      delete freelancer.eventFreelancers;
      delete freelancer.userId;
    }

    if (assignedFreelancer.length && freelancerType === WEDLANCER_ASSURED && response.status !== CANCELLED) {
      const daysCount = moment(response.endDate).diff(moment(response.startDate), 'days') + 1;
      const priceBreakDown = await eventPriceBreakDownForFreelancer(userId, daysCount, eventId);
      response.priceBreakdown = priceBreakDown;
    }

    if (response.status !== 'CANCELLED' && !assignedFreelancer.length) {
      response.cancelledBy = 'YOU';
      delete response.reviews;
      delete response.assignee;
      delete response.freelancers;
      delete response.timings;
      delete response.creator;
      delete response.recruiter;
    } else if (response.status === 'CANCELLED') {
      response.cancelledBy = response.cancelledByUser?.role;
      delete response.reviews;
      delete response.assignee;
      delete response.freelancers;
      delete response.timings;
      delete response.creator;
      delete response.recruiter;
    }

    delete response.eventIssue;
    delete response.reviews;
    delete response.cancelledByUser;
    delete response.assignedTo;
    return response;
  } catch (error) {
    eventLogger(`Error from get-freelancer-event-service: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = getFreelancerEventDetails;
