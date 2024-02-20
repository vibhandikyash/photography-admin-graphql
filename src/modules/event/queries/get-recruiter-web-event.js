const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const getRecruiterWebEvent = async (_, args, ctx) => {
  try {
    const {
      models: { Event: EventModel, EventTiming: EventTimingModel }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;

    const existingEvent = await EventModel.findByPk(eventId);
    if (!existingEvent || existingEvent.recruiterId !== userId) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }

    const event = await EventModel.findByPk(eventId, {
      attributes: ['id', 'name', 'assignedTo', 'startDate', 'endDate', 'location', 'totalBudget', 'isAssigned', 'cancelledBy',
        'leadType', 'status', 'note', 'createdAt'],
      include: [
        {
          model: EventTimingModel,
          as: 'timings',
          attributes: ['id', 'startDate', 'endDate'],
        },
      ],
    });
    return event;
  } catch (error) {
    eventLogger(`Error from getting recruiter web event: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterWebEvent;
