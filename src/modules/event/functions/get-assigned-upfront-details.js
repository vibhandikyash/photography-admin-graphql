/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const getUserAttendanceLogs = require('../../../rest/services/recruiters/get-user-attendance-logs');
const getUserEventReview = require('../../../rest/services/recruiters/get-user-event-reviews');

/* eslint-disable no-param-reassign */
const getAssignedUpfrontDetails = async (id, models) => {
  const {
    User: UserModel,
    Badge: BadgeModel,
    EventFreelancer: EventFreelancersModel,
    UpfrontCategoryRequirement: EventCategoryModel,
    UserBadge: FreelancerBadgeModel,
    Category: CategoryModel,
    Event: EventModel,
  } = models;

  let freelancersInstance = await EventModel.findByPk(
    id,
    {
      attributes: ['id', 'leadType', 'recruiterId'],
      include: [
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
            {
              model: EventFreelancersModel,
              as: 'freelancers',
              attributes: ['id', 'userId', 'finalizedPrice', 'isAssigned'],
              where: { isAssigned: true },
              required: false,
              include: [
                {
                  model: UserModel,
                  as: 'eventFreelancers',
                  attributes: ['fullName', 'contactNo', 'countryCode'],
                  include: [
                    {
                      model: FreelancerBadgeModel,
                      as: 'badge',
                      attributes: ['badgeId'],
                      include: [
                        {
                          model: BadgeModel,
                          as: 'userBadge',
                          attributes: ['name'],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  );
  freelancersInstance = JSON.parse(JSON.stringify(freelancersInstance));

  const categories = [];
  for (let category of freelancersInstance.categories) {
    const { eventCategory } = category;
    delete category.eventCategory;
    category = { ...category, ...eventCategory };

    const freelancers = [];
    for (let freelancer of category.freelancers) {
      const { eventFreelancers } = freelancer;
      delete freelancer.eventFreelancers;

      let attendanceLogs = await getUserAttendanceLogs(freelancer.userId, id, false);
      attendanceLogs = attendanceLogs?.map(attendance => {
        const { eventTimings } = attendance;
        delete attendance.eventTimings;
        attendance = { ...attendance, ...eventTimings };
        return attendance;
      });

      freelancer.attendance = attendanceLogs;

      // reviews and ratings
      const reviewGiven = await getUserEventReview(freelancer.userId, freelancersInstance.recruiterId, id);
      const reviewReceived = await getUserEventReview(freelancersInstance.recruiterId, freelancer.userId, id);

      // KEPT ARRAY AS API ALREADY INTEGRATED
      freelancer.reviewFor = reviewGiven ? [reviewGiven] : [];
      freelancer.reviewCreator = reviewReceived ? [reviewReceived] : [];

      if (eventFreelancers.badge) {
        const { badge } = eventFreelancers;
        const badges = [];
        // spread user badge object
        badge?.forEach(badgeObj => {
          const { userBadge } = badgeObj;
          badgeObj = { ...badgeObj, ...userBadge };
          badges.push(badgeObj);
          delete badgeObj.userBadge;
        });
        eventFreelancers.badges = badges;
      }
      freelancer = { ...freelancer, ...eventFreelancers };
      freelancers.push(freelancer);
    }

    category.freelancers = freelancers;
    categories.push(category);
  }

  freelancersInstance.categories = categories;
  delete freelancersInstance.freelancers;
  return freelancersInstance;
};

module.exports = getAssignedUpfrontDetails;
