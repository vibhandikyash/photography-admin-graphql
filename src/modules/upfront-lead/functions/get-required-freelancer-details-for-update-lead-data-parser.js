const upfrontLeadLogger = require('../upfront-lead-logger');

const getRequiredFreelancerDetailsForUpdateLead = async (freelancers, ctx) => {
  try {
    const categoriesData = [];
    let sumOfRequiredFreelancer = 0;

    freelancers.forEach(category => {
      const {
        id, categoryType, count, pricePerDay,
      } = category;
      const eventCategories = {
        id,
        categoryType,
        count,
        pricePerDay,
      };
      sumOfRequiredFreelancer += eventCategories.pricePerDay * eventCategories?.count;

      categoriesData.push(eventCategories);
    });
    return [categoriesData, sumOfRequiredFreelancer];
  } catch (error) {
    upfrontLeadLogger(`Error from update lead : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRequiredFreelancerDetailsForUpdateLead;
