const chatsLogger = require('../chats-logger');
const getUpfrontChatGroupService = require('../services/get-upfront-chat-group-service');

const chatGroup = async (_, args, ctx) => {
  try {
    const { localeService } = ctx;
    const { where: { id: chatGroupId } } = args;
    const chatGroupInstance = await getUpfrontChatGroupService(chatGroupId, localeService);
    return chatGroupInstance;
  } catch (error) {
    chatsLogger(`Error from getting chat group data from admin: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = chatGroup;
