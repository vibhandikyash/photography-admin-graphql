const { ORGANIC, UPFRONT } = require('../../../../../constants/service-constants');
const {
  models:
  {
    UserProfile: UserProfileModel,
    Event: EventModel,
  },
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');

const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');

const getRecruiterOrganicEventService = require('../../../../services/get-recruiter-organic-event-service');
const getRecruiterUpfrontDetails = require('../../../../services/get-recruiter-upfront-event-service');
const { OK, INVALID_INPUT } = require('../../../../services/http-status-codes');
const eventLogger = require('../../../events/event-logger');

const getRecruiterEvent = async (req, res, next) => {
  try {
    const { user } = req;
    const { id: eventId } = req.params;

    if (!validateUUID(eventId)) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    const eventInstance = await EventModel.findByPk(eventId, { attributes: ['id', 'recruiterId', 'leadType'] });

    if (!eventInstance || eventInstance.recruiterId !== user.id) {
      throw new ApiError('EVENT_NOT_FOUND_FOR_LOGGED_IN_USER', 404);
    }

    const profile = await UserProfileModel.findOne({
      where: {
        userId: user.id,
      },
    });
    const { leadType } = eventInstance;
    let data;

    if (leadType === ORGANIC) {
      data = await getRecruiterOrganicEventService(user, eventId, profile?.typeKey);
    }
    if (leadType === UPFRONT) {
      data = await getRecruiterUpfrontDetails(user, eventId, profile?.typeKey);
    }

    return sendSuccessResponse(res, 'SUCCESS', OK, data);
  } catch (error) {
    eventLogger(`Error from get-event: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getRecruiterEvent;
