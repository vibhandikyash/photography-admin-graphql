/* eslint-disable no-restricted-syntax */

const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const chatsLogger = require('../chats-logger');
const getWebChatGroupService = require('../services/get-web-chat-group-service');

const getRecruiterWebOrganicChatGroup = async (_, args, ctx) => {
  try {
    const {
      models: { Event: EventModel }, req: { user: { id: userId } }, localeService,
    } = ctx;
    const { where: { id: eventId } } = args;

    const event = await EventModel.findByPk(eventId);
    if (!event || event.recruiterId !== userId) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const chatGroupsData = await getWebChatGroupService(eventId);
    return chatGroupsData;
  } catch (error) {
    chatsLogger(`Error from getting recruiter web organic chat group data: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterWebOrganicChatGroup;
