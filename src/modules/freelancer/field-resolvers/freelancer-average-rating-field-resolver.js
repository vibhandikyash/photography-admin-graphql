const freelancerLogger = require('../freelancer-logger');

const freelancerAverageRatingFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { overAllRating, communicationRating, punctualityRating } = parent;

    const averageRating = (overAllRating + communicationRating + punctualityRating) / 3;
    return averageRating;
  } catch (err) {
    freelancerLogger(`Error in freelancerAverageRatingFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = freelancerAverageRatingFieldResolver;
