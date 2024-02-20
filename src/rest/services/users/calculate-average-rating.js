/* eslint-disable no-restricted-syntax */
const { isNaN } = require('lodash');

const { models: { UserReview: UserReviewModel, UserProfile: UserProfileModel } } = require('../../../sequelize-client');
const freelancersLogger = require('../../modules/freelancers/freelancers-logger');

const calculateAverageRating = async userId => {
  try {
    const reviewInstances = await UserReviewModel.findAll({ where: { userId } });
    const eventAverageRatings = [];
    let userAverageRatings = 0;
    let totalRatings = 0;
    for (const review of reviewInstances) {
      let { overAllRating = 0, punctualityRating = 0, communicationRating = 0 } = review;

      overAllRating = isNaN(overAllRating) ? 0 : overAllRating;
      punctualityRating = isNaN(punctualityRating) ? 0 : punctualityRating;
      communicationRating = isNaN(communicationRating) ? 0 : communicationRating;

      const ratings = (overAllRating + communicationRating + punctualityRating) / 3;
      eventAverageRatings.push(ratings);
    }

    if (eventAverageRatings && eventAverageRatings.length) {
      for (const rating of eventAverageRatings) {
        totalRatings += rating;
        userAverageRatings = totalRatings / eventAverageRatings.length;
      }
    }
    await UserProfileModel.update({ averageRating: userAverageRatings }, { where: { userId } }, { returning: true });
  } catch (error) {
    freelancersLogger(`Error from calculate-average-ratings: ${error.message}`, null, 'error');
  }
};

module.exports = calculateAverageRating;
