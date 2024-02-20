const chatsLogger = require('../chats-logger');
const getUpfrontChatGroupService = require('../services/get-upfront-chat-group-service');

const getRecruiterWebUpfrontChatGroup = async (_, args, ctx) => {
  try {
    const { localeService } = ctx;
    const { where: { id: chatGroupId } } = args;
    const chatGroupInstance = await getUpfrontChatGroupService(chatGroupId, localeService);
    return chatGroupInstance;
  } catch (error) {
    chatsLogger(`Error from getting recruiter web upfront chat group: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterWebUpfrontChatGroup;
