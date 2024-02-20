/* eslint-disable no-restricted-syntax */
const { isEmpty } = require('lodash');

const eventLogger = require('../../modules/events/event-logger');

const reviewsRatingsDataParser = async (reviews, freelancer) => {
  try {
    const reviewsData = [];
    for (const reviewObj of reviews) {
      if (reviewObj && !isEmpty(reviewObj)) {
        if (reviewObj?.userId === freelancer?.user?.id) {
          const review = {
            ratedTo: 'freelancer',
            isRatedByRecruiter: true,
            review: reviewObj.review,
            averageRating: (reviewObj.overAllRating + reviewObj.communicationRating + reviewObj.punctualityRating) / 3,
            punctualityRating: reviewObj.punctualityRating,
            communicationRating: reviewObj.communicationRating,
            overAllRating: reviewObj.overAllRating,
          };
          reviewsData.push(review);
        } else if (reviewObj?.reviewerId === freelancer?.user?.id) {
          const review = {
            ratedTo: 'recruiter',
            isRatedByFreelancer: true,
            review: reviewObj.review,
            averageRating: (reviewObj.overAllRating + reviewObj.communicationRating + reviewObj.punctualityRating) / 3,
            punctualityRating: reviewObj.punctualityRating,
            communicationRating: reviewObj.communicationRating,
            overAllRating: reviewObj.overAllRating,
          };
          reviewsData.push(review);
        }
      }
    }
    return reviewsData;
  } catch (error) {
    eventLogger(`Error from reviews-and-ratings-data-parser: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = reviewsRatingsDataParser;
