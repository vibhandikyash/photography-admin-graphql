const defaultLogger = require('../../../../../logger');
const {
  models:
  {
    Event: EventModel,
    UserProfile: UserProfileModel,
  },
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const getFreelancerEventDetails = require('../../../../services/get-freelancer-lead');
const { INVALID_INPUT, OK } = require('../../../../services/http-status-codes');

const getLead = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const { user } = req;
    if (!validateUUID(eventId)) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    const eventInstance = await EventModel.findByPk(eventId);

    if (!eventInstance) {
      throw new ApiError('EVENT_NOT_FOUND', 404);
    }

    const profile = await UserProfileModel.findOne({
      where: {
        userId: user.id,
      },
    });

    const response = await getFreelancerEventDetails(user.id, eventId, profile.typeKey);

    return sendSuccessResponse(res, 'SUCCESS', OK, response);
  } catch (error) {
    defaultLogger(`Error in get-lead: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getLead;
