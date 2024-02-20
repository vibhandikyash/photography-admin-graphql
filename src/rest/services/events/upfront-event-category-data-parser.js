/* eslint-disable no-loop-func */
/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { filter, flattenDeep } = require('lodash');
const moment = require('moment');

const {
  WEDLANCER_ASSURED, CANCELLED,
} = require('../../../constants/service-constants');
const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');

const eventLogger = require('../../modules/events/event-logger');
const getEventDispute = require('../disputes/get-event-dispute');
const getUserAttendanceLogs = require('../recruiters/get-user-attendance-logs');
const getUserEventReviews = require('../recruiters/get-user-event-reviews');

const eventPriceBreakDownForRecruiter = require('./event-price-breakdown-for-recruiter');

const reviewsRatingsDataParser = require('./reviews-ratings-data-parser');

const upfrontEventCategoryDataParser = async (user, eventInstance) => {
  try {
    let totalCategoriesCount = 0;
    let totalFreelancerCount = 0;
    const categoriesData = [];
    const combinedFreelancerArray = [];

    const { categories } = eventInstance;

    for (let category of categories) {
      // total count of the categories
      totalCategoriesCount += category.count;
      const { eventCategory } = category;
      delete category.eventCategory;

      const assignedFreelancers = filter(category.freelancers, ['isAssigned', true]);

      const freelancers = category.count > assignedFreelancers.length ? category.freelancers : assignedFreelancers;
      category = { ...category, ...eventCategory, assignedFreelancerCount: assignedFreelancers.length };

      const freelancersData = [];
      for (const freelancer of freelancers) {
        const { eventFreelancers } = freelancer;

        delete freelancer.eventFreelancers;
        freelancer.user = eventFreelancers;
        freelancer.user.category = eventFreelancers?.business?.userCategory?.n;

        const { typeKey } = freelancer.user.profile;

        if (freelancer?.user?.profile?.profilePhoto) {
          [freelancer.user.profile.profilePhoto] = await getKeysAndGenerateUrl([eventFreelancers.profile.profilePhoto]);
        }

        if (typeKey === WEDLANCER_ASSURED) {
          let attendanceLogs = await getUserAttendanceLogs(freelancer.user.id, eventInstance.id);
          attendanceLogs = attendanceLogs?.map(attendance => {
            const { eventTimings } = attendance;
            delete attendance.eventTimings;
            attendance = { ...attendance, ...eventTimings };
            return attendance;
          });

          freelancer.user.attendance = attendanceLogs;
        }
        // check user type
        if (typeKey === WEDLANCER_ASSURED && eventInstance.status === 'COMPLETED') {
          // reviews
          const reviews = [];
          const reviewGiven = await getUserEventReviews(user.id, freelancer.user.id, eventInstance.id);
          const reviewReceived = await getUserEventReviews(freelancer.user.id, user.id, eventInstance.id, true);

          reviews.push(reviewReceived, reviewGiven);

          freelancer.user.reviews = await reviewsRatingsDataParser(reviews, freelancer);

          // dispute raised
          const issue = await getEventDispute(user.id, eventInstance.id);
          if (issue?.userId === freelancer?.user?.id) {
            freelancer.issue = issue;
          }
        }

        delete freelancer.user.reviewFor;
        delete freelancer.user.business;
        delete freelancer.user.reviewCreator;

        freelancersData.push(freelancer);
      }

      // filter the freelancer for price breakdown
      combinedFreelancerArray.push(assignedFreelancers);
      category.freelancers = freelancersData;
      categoriesData.push(category);
    }

    // price breakdown for recruiter
    const assignedFreelancerData = flattenDeep(combinedFreelancerArray);
    if (assignedFreelancerData.length && eventInstance.status !== CANCELLED) {
      const daysCount = moment(eventInstance.endDate).diff(moment(eventInstance.startDate), 'days') + 1;
      const priceBreakdown = await eventPriceBreakDownForRecruiter(user.id, assignedFreelancerData, eventInstance.id, daysCount);
      eventInstance.priceBreakdown = priceBreakdown;
    }

    // total freelancer count
    totalFreelancerCount += assignedFreelancerData.length;
    return { categoriesData, totalCategoriesCount, totalFreelancerCount };
  } catch (error) {
    eventLogger(`Error from upfront-event-category-data-parser: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = upfrontEventCategoryDataParser;
