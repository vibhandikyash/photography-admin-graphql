/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
/* eslint-disable max-lines */
/* eslint-disable no-restricted-syntax */
const {
  models:
  {
    UserProfile: ProfileModel,
    EventTiming: EventTimingsModel,
    City: CityModel,
    User: UserModel,
    EventFreelancer: EventFreelancersModel,
    UpfrontCategoryRequirement: EventCategoryModel,
    Category: CategoryModel,
    Event: EventModel,
    UserBusiness: UserBusinessModel,
    UserProfile: UserProfileModel,
  },
} = require('../../sequelize-client');
const { getMessage } = require('../../utils/messages');

const eventLogger = require('../modules/events/event-logger');

const { ApiError } = require('./custom-api-error');
const upfrontEventCategoryDataParser = require('./events/upfront-event-category-data-parser');

const getRecruiterUpfronDetails = async (user, eventId, recruiterType = 'NON_PAID') => {
  try {
    const includeOptions = [
      {
        model: UserModel,
        as: 'recruiter',
        attributes: ['id', 'fullName', 'contactNo'],
        include: [
          {
            model: ProfileModel,
            as: 'profile',
            attributes: ['typeKey'],
          },
        ],
      },
      {
        model: UserModel,
        as: 'assignee',
        attributes: ['id', 'role', 'fullName', 'contactNo'],
      },
      {
        model: CityModel,
        as: 'cities',
        attributes: ['id', 'name'],
      },
      {
        model: EventTimingsModel,
        as: 'timings',
        attributes: ['id', 'startDate', 'endDate'],
      },
      {
        model: UserModel,
        as: 'cancelledByUser',
        attributes: ['id', 'fullName', 'countryCode', 'contactNo', 'role'],
      },
      {
        model: EventCategoryModel,
        as: 'categories',
        attributes: ['id', 'count', 'pricePerDay'],
        include: [
          {
            model: CategoryModel,
            as: 'eventCategory',
            attributes: ['name'],
          },
          {
            model: EventFreelancersModel,
            as: 'freelancers',
            attributes: ['id', 'userId', 'finalizedPrice', 'isAssigned'],
            required: false,
            include: [
              {
                model: UserModel,
                as: 'eventFreelancers',
                attributes: ['id', 'fullName', 'contactNo', 'countryCode'],
                include: [
                  {
                    model: UserProfileModel,
                    as: 'profile',
                    attributes: ['typeKey', 'profilePhoto'],
                  },
                  {
                    model: UserBusinessModel,
                    as: 'business',
                    attributes: ['projectsComplete', 'categoryId'],
                    include: [{
                      model: CategoryModel,
                      as: 'userCategory',
                      attributes: [['name', 'n']],
                    }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    let eventInstance = await EventModel.findByPk(eventId, {
      attributes: ['id', 'name', 'createdBy', 'location', 'startDate', 'endDate', 'note', 'status', 'totalBudget', 'leadType', 'createdAt'],
      where: { leadType: 'UPFRONT' },
      include: includeOptions,
      order: [[{ model: EventTimingsModel, as: 'timings' }, 'startDate', 'ASC']],
    });

    if (!eventInstance) {
      throw new ApiError(getMessage('EVENT_NOT_FOUND'), 404);
    }

    eventInstance = JSON.parse(JSON.stringify(eventInstance));

    // parse the categories and freelancers data
    const { categoriesData, totalCategoriesCount, totalFreelancerCount } = await upfrontEventCategoryDataParser(user, eventInstance, recruiterType);

    eventInstance.categories = categoriesData;
    delete eventInstance.freelancers;

    // total remaining freelancer count
    const remainingFreelancerCount = totalCategoriesCount - totalFreelancerCount;
    eventInstance.remainingFreelancerCount = remainingFreelancerCount;

    // parse the eventInstance for cancelled by user
    if (eventInstance.cancelledByUser?.id === user.id) {
      eventInstance.cancelledBy = 'YOU';
    } else {
      eventInstance.cancelledBy = eventInstance.cancelledByUser?.role;
    }
    delete eventInstance.cancelledByUser;

    if (eventInstance.status === 'CANCELLED') {
      delete eventInstance.categories;
      delete eventInstance.assignee;
      delete eventInstance.timings;
    }

    return eventInstance;
  } catch (error) {
    eventLogger(`Error from get-recruiter-upfront-event-service: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = getRecruiterUpfronDetails;
