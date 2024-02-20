const freelancerLogger = require('../freelancer-logger');

const getFreelancerBadge = async (_, args, ctx) => {
  try {
    const {
      models: {
        Badge: FreelancerBadgeModel,
      },
    } = ctx;

    const freelancerBadge = await FreelancerBadgeModel.findAll();

    return freelancerBadge;
  } catch (error) {
    freelancerLogger(`Error from get freelancer category: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerBadge;
