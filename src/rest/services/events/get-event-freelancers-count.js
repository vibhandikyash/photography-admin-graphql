/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const {
  filter,
  flattenDeep,
} = require('lodash');

const {
  models: {
    UpfrontCategoryRequirement: UpfrontCategoryRequirementModel,
    EventFreelancer: EventFreelancerModel,
  },
} = require('../../../sequelize-client');

const eventLogger = require('../../modules/events/event-logger');

const getEventFreelancersCount = async (userId, eventId) => {
  try {
    const eventCategories = await UpfrontCategoryRequirementModel.findAll({
      where: { eventId },
      attributes: ['id', 'eventId', 'count'],
      include: [
        {
          model: EventFreelancerModel,
          as: 'freelancers',
          attributes: ['id', 'isAssigned'],
        },
      ],
    });

    let totalCategoriesCount = 0;
    let totalFreelancerCount = 0;

    const combinedFreelancerArray = [];

    if (eventCategories.length) {
      for (const category of eventCategories) {
        // total count of the categories
        totalCategoriesCount += category.count;

        const assignedFreelancers = filter(category.freelancers, ['isAssigned', true]);

        combinedFreelancerArray.push(assignedFreelancers);
      }

      const assignedFreelancerData = flattenDeep(combinedFreelancerArray);

      // total freelancer count
      totalFreelancerCount += assignedFreelancerData.length;
    }
    return { totalCategoriesCount, totalFreelancerCount };
  } catch (error) {
    eventLogger(`Error from get-event-freelancer-count: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = getEventFreelancersCount;
