const { get } = require('lodash');

const { WEDLANCER_ASSURED } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');
const getWebEventAttendanceLogsService = require('../functions/get-web-event-attendance-logs-service');

const getFreelancerWebAttendanceLogs = async (_, args, ctx) => {
  try {
    const {
      models: { UserProfile: UserProfileModel, Event: EventModel }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;

    const event = await EventModel.findByPk(eventId);
    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    const freelancer = await UserProfileModel.findOne({ where: { userId }, attributes: ['typeKey'] });
    const { typeKey } = freelancer;
    if (typeKey !== WEDLANCER_ASSURED) {
      throw new CustomApolloError(getMessage('LOGS_NOT_FOUND', localeService));
    }

    let attendanceLogs = await getWebEventAttendanceLogsService(userId, eventId);
    attendanceLogs = attendanceLogs?.map(attendance => {
      const { eventTimings } = attendance;
      const regularizeRequest = get(eventTimings, 'regularizeRequests[0]');
      attendance.regularizeRequest = regularizeRequest;
      return attendance;
    });
    return attendanceLogs;
  } catch (error) {
    eventLogger(`Error from getting freelancer web attendance logs: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebAttendanceLogs;
