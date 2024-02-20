/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const getAssignedOrganicDetails = async (id, models) => {
  const {
    User: UserModel,
    Badge: BadgeModel,
    EventFreelancer: EventFreelancersModel,
    FreelancerAttendance: FreelancerAttendanceModel,
    UserBadge: FreelancerBadgeModel,
    EventTiming: EventTimingModel,
    UserReview: UserReviewModel,
    Event: EventModel,
  } = models;

  let freelancersInstance = await EventModel.findByPk(
    id,
    {
      attributes: ['id', 'leadType'],
      include: [
        {
          model: EventFreelancersModel,
          as: 'freelancers',
          where: { isAssigned: true },
          required: false,
          attributes: ['id', 'userId', 'finalizedPrice', 'isAssigned'],
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
                {
                  model: FreelancerAttendanceModel,
                  as: 'attendance',
                  attributes: ['id', 'otp', 'firstClockIn', 'lastClockOut'],
                  where: { eventId: id },
                  required: false,
                  include: [
                    {
                      model: EventTimingModel,
                      as: 'eventTimings',
                      attributes: ['startDate'],
                    },
                  ],
                },
                {
                  model: UserReviewModel,
                  as: 'reviewFor',
                  where: { eventId: id },
                  required: false,
                  attributes: ['id', 'userId', 'eventId', 'overAllRating', 'communicationRating', 'punctualityRating', 'status', 'review'],
                },
                {
                  model: UserReviewModel,
                  as: 'reviewCreator',
                  where: { eventId: id },
                  required: false,
                  attributes: ['id', 'userId', 'eventId', 'overAllRating', 'communicationRating', 'punctualityRating', 'status', 'review'],
                },
              ],
            },
          ],
        },
      ],
      order: [[
        { model: EventFreelancersModel, as: 'freelancers' },
        { model: UserModel, as: 'eventFreelancers' },
        { model: FreelancerAttendanceModel, as: 'attendance' },
        { model: EventTimingModel, as: 'eventTimings' }, 'startDate', 'DESC',
      ]],
    },
  );
  freelancersInstance = JSON.parse(JSON.stringify(freelancersInstance));
  const { freelancers } = freelancersInstance;
  delete freelancersInstance.freelancers;

  const freelancersData = [];

  for (let freelancer of freelancers) {
    const { eventFreelancers } = freelancer;
    delete freelancer.eventFreelancers;

    let { attendance: freelancerAttendance } = eventFreelancers;
    const { reviewFor, reviewCreator } = eventFreelancers;

    freelancerAttendance = freelancerAttendance?.map(attendance => {
      const { eventTimings } = attendance;
      delete attendance.eventTimings;
      attendance = { ...attendance, ...eventTimings };
      return attendance;
    });

    eventFreelancers.attendance = freelancerAttendance;
    eventFreelancers.reviewFor = reviewFor;
    eventFreelancers.reviewCreator = reviewCreator;

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

      freelancer.badges = badges;
    }

    freelancer = { ...freelancer, ...eventFreelancers };
    freelancersData.push(freelancer);
  }
  freelancersInstance.freelancers = freelancersData;
  return freelancersInstance;
};

module.exports = getAssignedOrganicDetails;
