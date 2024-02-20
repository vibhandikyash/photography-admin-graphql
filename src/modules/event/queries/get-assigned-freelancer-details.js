/* eslint-disable max-lines */
/* eslint-disable no-param-reassign */
const { ORGANIC, UPFRONT } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');
const getAssignedOrganicDetails = require('../functions/get-assigned-organic-details');
const getAssignedUpfrontDetails = require('../functions/get-assigned-upfront-details');

const getAssignedFreelancerDetails = async (_, args, ctx) => {
  try {
    const {
      models: {
        Event: EventModel,
      },
      localeService,
    } = ctx;
    const { id } = args;

    const eventInstance = await EventModel.findByPk(id, {
      attributes: ['id', 'leadType'],
    });

    if (!eventInstance) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    let freelancersInstance;
    if (eventInstance.leadType === ORGANIC) {
      freelancersInstance = await getAssignedOrganicDetails(id, ctx.models);
    }
    if (eventInstance.leadType === UPFRONT) {
      freelancersInstance = await getAssignedUpfrontDetails(id, ctx.models);
    }
    return freelancersInstance;
  } catch (error) {
    eventsLogger(`Error get-assigned-freelancer-details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getAssignedFreelancerDetails;
