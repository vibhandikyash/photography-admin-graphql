/* eslint-disable no-param-reassign */
const {
  User: UserModel,
  Event: EventModel,
  EventTiming: EventTimingModel,
  EventFreelancer: EventFreelancerModel,
  UpfrontCategoryRequirement: UpfrontCategoryRequirementModel,
  Category: CategoryModel,
} = require('../../../../../sequelize-client');

const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const eventLogger = require('../../event-logger');

const getEventDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const userInstance = await UserModel.findByPk(user.id);

    const query = {
      attributes: ['id', 'name', 'createdBy', 'location', 'startDate', 'endDate', 'note', 'status', 'totalBudget', 'leadType'],
      include: [
        {
          model: UserModel,
          as: 'creator',
          attributes: ['id', 'fullName', 'contactNo'],
        },
        {
          model: UserModel,
          as: 'assignee',
          attributes: ['id', 'role', 'fullName', 'contactNo'],
        },
        {
          model: EventTimingModel,
          as: 'timings',
          attributes: ['id', 'startTime', 'endTime', 'date'],
        },
        {
          model: UpfrontCategoryRequirementModel,
          as: 'categories',
          attributes: ['id', 'pricePerDay', 'count'],
          include: [
            {
              model: EventFreelancerModel,
              as: 'freelancers',
              attributes: ['id', 'finalizedPrice', 'isAssigned'],
              include: [
                {
                  model: UserModel,
                  as: 'eventFreelancers',
                  attributes: ['fullName'],
                },
              ],
            },
            {
              model: CategoryModel,
              as: 'eventCategory',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: EventFreelancerModel,
          as: 'freelancers',
          attributes: ['id', 'finalizedPrice', 'isAssigned'],
          include: [
            {
              model: UserModel,
              as: 'eventFreelancers',
              attributes: ['fullName'],
            },
          ],
        },
      ],
    };

    let eventInstance = await EventModel.findByPk(id, query);

    if (!eventInstance) {
      throw new ApiError('EVENT_NOT_FOUND', 404);
    }

    // // append category and freelancers name to the category and freelancer object
    eventInstance = JSON.parse(JSON.stringify(eventInstance));

    let { categories, freelancers } = eventInstance;
    if (eventInstance.leadType === 'ORGANIC') {
      freelancers = freelancers?.map(freelancer => {
        const { eventFreelancers } = freelancer;
        delete freelancer.eventFreelancers;
        freelancer = { ...freelancer, ...eventFreelancers };
        return freelancer;
      });
      eventInstance.freelancers = freelancers;
      delete eventInstance.categories;
    } else if (eventInstance.leadType === 'UPFRONT') {
      eventInstance.freelancers = freelancers;

      categories = categories?.map(category => {
        const { eventCategory } = category;
        delete category.eventCategory;
        category = { ...category, ...eventCategory };

        freelancers = category.freelancers;

        freelancers = freelancers?.map(freelancer => {
          const { eventFreelancers } = freelancer;
          delete freelancer.eventFreelancers;
          freelancer = { ...freelancer, ...eventFreelancers };
          return freelancer;
        });
        category.freelancers = freelancers;
        return category;
      });

      eventInstance.categories = categories;
      delete eventInstance.freelancers;
    }

    // check user type
    if (userInstance.role === 'FREELANCER') {
      delete eventInstance.categories;
    }

    if (eventInstance.status === 'CANCELLED') {
      delete eventInstance.creator;
      delete eventInstance.assignee;
      delete eventInstance.timings;
      delete eventInstance.categories;
      delete eventInstance.freelancers;
    }

    return sendSuccessResponse(res, 'SUCCESS', 200, eventInstance);
  } catch (error) {
    eventLogger(`Error from get-event-details: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getEventDetails;
