const { get } = require('lodash');

const { WC_ASSIGNED, WC_NOT_ASSIGNED } = require('../../../constants/service-constants');

const getOrganicEventDetails = async (id, models) => {
  const {
    User: UserModel, Event: EventModel, UserProfile: ProfileModel, EventTiming: EventTimingsModel,
    EventFreelancer: EventFreelancersModel, City: CityModel, UserBusiness: UserBusinessModel,
    Category: CategoryModel,
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
        model: EventFreelancersModel,
        as: 'freelancers',
        where: { isRequested: true },
        required: false,
        attributes: ['id', 'finalizedPrice', 'userId', 'isAssigned', 'isRequested'],
        include: [
          {
            model: UserModel,
            as: 'eventFreelancers',
            attributes: ['fullName', 'contactNo', 'countryCode'],
            include: [
              {
                model: UserBusinessModel,
                as: 'business',
                attributes: ['categoryId'],
                include: [
                  {
                    model: CategoryModel,
                    as: 'userCategory',
                    attributes: ['id', 'name'],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    order: [[{ model: EventTimingsModel, as: 'timings' }, 'startDate', 'ASC']],
  });
  eventInstance = JSON.parse(JSON.stringify(eventInstance));
  let { freelancers } = eventInstance;
  const { profile } = eventInstance.recruiter;
  delete eventInstance.recruiter.profile;
  eventInstance.recruiter = { ...eventInstance.recruiter, ...profile };
  freelancers = freelancers?.map(freelancer => {
    const { eventFreelancers } = freelancer;
    const categoryName = get(eventFreelancers, 'business.userCategory.name');
    delete freelancer.eventFreelancers;
    freelancer = { ...freelancer, ...eventFreelancers, categoryName };
    return freelancer;
  });
  eventInstance.freelancers = freelancers;
  if (eventInstance.assignee === null) {
    status = WC_NOT_ASSIGNED;
  } else {
    status = WC_ASSIGNED;
  }
  // TODO need to maintain freelancer assignment status
  return { eventInstance, status };
};

module.exports = getOrganicEventDetails;
