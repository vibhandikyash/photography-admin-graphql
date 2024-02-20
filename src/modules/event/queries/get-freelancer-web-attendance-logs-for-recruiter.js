const { WEDLANCER_ASSURED } = require('../../../constants/service-constants');
const eventLogger = require('../event-logger');
const getWebEventAttendanceLogsService = require('../functions/get-web-event-attendance-logs-service');

const getFreelancerWebAttendanceLogsForRecruiter = async (_, args, ctx) => {
  try {
    const { models: { UserProfile: UserProfileModel, Event: EventModel, EventFreelancer: EventFreelancerModel } } = ctx;
    const { where: { eventId, freelancerId } } = args;

    const event = await EventModel.findByPk(eventId, {
      include: {
        model: EventFreelancerModel,
        as: 'freelancers',
        where: { userId: freelancerId, isAssigned: true },
      },
    });

    // FE REQUIREMENT TO RETURN NULL INSTEAD OF ERROR
    if (!event) {
      return null;
    }

    const freelancer = await UserProfileModel.findOne({ where: { userId: freelancerId }, attributes: ['typeKey'] });
    const { typeKey } = freelancer;
    if (typeKey !== WEDLANCER_ASSURED) {
      return null;
    }

    const attendanceLogs = await getWebEventAttendanceLogsService(freelancerId, eventId);
    return attendanceLogs;
  } catch (error) {
    eventLogger(`Error from getting freelancer web attendance logs for recruiter: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebAttendanceLogsForRecruiter;
