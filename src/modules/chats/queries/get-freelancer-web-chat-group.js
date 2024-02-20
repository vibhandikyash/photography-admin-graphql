/* eslint-disable no-restricted-syntax */
const { WEDLANCER_ASSURED } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const chatsLogger = require('../chats-logger');
const getWebChatGroupService = require('../services/get-web-chat-group-service');

const getFreelancerWebChatGroup = async (_, args, ctx) => {
  try {
    const {
      models: { UserProfile: UserProfileModel, Event: EventModel }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;
    const { req: { user: { id: userId } } } = ctx;

    const freelancerProfile = await UserProfileModel.findOne({ where: { userId }, attributes: ['typeKey'] });
    const { typeKey } = freelancerProfile;
    if (typeKey !== WEDLANCER_ASSURED) {
      throw new CustomApolloError(getMessage('UNAUTHORIZED', localeService));
    }

    const event = await EventModel.findByPk(eventId);
    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const chatGroupsData = await getWebChatGroupService(eventId);
    return chatGroupsData;
  } catch (error) {
    chatsLogger(`Error from getting freelancer chat group data from web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerWebChatGroup;
