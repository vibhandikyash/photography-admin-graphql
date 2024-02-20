const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const chatsLogger = require('../chats-logger');
const getWebChatMessagesService = require('../services/get-web-chat-messages-service');

const getWebChatMessages = async (_, args, ctx) => {
  try {
    const { where: { id: chatGroupId }, filter: { skip: offset = 0, afterDate, beforeDate } } = args;
    const { req: { user: { id: userId } }, localeService } = ctx;
    let { filter: { limit = QUERY_PAGING_MIN_COUNT } } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const {
      messagesCount,
      chatMessagesData,
    } = await getWebChatMessagesService(userId, chatGroupId, limit, offset, afterDate, beforeDate, localeService);

    return { count: messagesCount, chatMessages: chatMessagesData };
  } catch (error) {
    chatsLogger(`Error from getting chat group messages from web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getWebChatMessages;
