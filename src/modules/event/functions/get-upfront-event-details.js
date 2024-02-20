const { WC_ASSIGNED, WC_NOT_ASSIGNED, FREELANCER_ASSIGNED } = require('../../../constants/service-constants');

const getUpfrontEventDetails = async (id, models) => {
  const {
    User: UserModel,
    Event: EventModel,
    UserProfile: ProfileModel,
    EventTiming: EventTimingsModel,
    UpfrontCategoryRequirement: EventCategoryModel,
    Category: CategoryModel,
    City: CityModel,
  } = models;
  let status = '';
  let eventInstance = await EventModel.findByPk(id, {
    attributes: ['id', 'name', 'createdBy', 'location', 'startDate', 'endDate', 'note', 'status', 'totalBudget', 'leadType'],
    include: [
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
        model: EventCategoryModel,
        as: 'categories',
        attributes: ['id', 'categoryType', 'count', 'pricePerDay'],
        include: [
          {
            model: CategoryModel,
            as: 'eventCategory',
            attributes: ['name'],
          },
        ],
      },
    ],
    order: [[{ model: EventTimingsModel, as: 'timings' }, 'startDate', 'ASC']],
  });
  eventInstance = JSON.parse(JSON.stringify(eventInstance));

  let { categories, freelancers } = eventInstance;
  const { profile } = eventInstance.recruiter;
  delete eventInstance.recruiter.profile;
  eventInstance.recruiter = { ...eventInstance.recruiter, ...profile };

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

  if (eventInstance.assignee === null) {
    status = WC_NOT_ASSIGNED;
  } else {
    status = WC_ASSIGNED;
  }

  if (eventInstance.categories?.freelancers?.length) {
    status = FREELANCER_ASSIGNED;
  }

  return { eventInstance, status };
};

module.exports = getUpfrontEventDetails;
