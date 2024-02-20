const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const chatsLogger = require('../chats-logger');
const getUpfrontChatGroupsService = require('../services/get-upfront-chat-groups-service');

const getRecruiterWebUpfrontChatGroups = async (_, args, ctx) => {
  try {
    const { req: { user: { id: userId } }, localeService } = ctx;
    const { where: { eventId } } = args;
    const { filter: { skip: offset = 0 } } = args;
    let { filter: { limit = QUERY_PAGING_MIN_COUNT } } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const { chatGroupsData, count } = await getUpfrontChatGroupsService(eventId, userId, limit, offset, localeService);
    return { chatGroups: chatGroupsData, count };
  } catch (error) {
    chatsLogger(`Error from getting upfront chat groups from web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterWebUpfrontChatGroups;
