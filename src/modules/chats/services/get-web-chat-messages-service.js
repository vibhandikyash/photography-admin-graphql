const { map } = require('lodash');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const { models: { ChatGroup: ChatGroupModel, ChatMessage: ChatMessageModel, User: UserModel } } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const chatsLogger = require('../chats-logger');

const getWebChatMessagesService = async (userId, chatGroupId, limit, offset, afterDate, beforeDate, localeService) => {
  try {
    const existingChatGroup = await ChatGroupModel.findByPk(chatGroupId);
    if (!existingChatGroup) {
      throw new CustomApolloError(getMessage('CHAT_GROUP_NOT_FOUND', localeService));
    }

    // GET MESSAGE COUNT PER GROUP ID
    const messagesCount = await ChatMessageModel.count({ where: { chatGroupId } });

    // MADE CONDITION FOR CREATED AT
    const dateCondition = [];
    if (afterDate) dateCondition.push({ [Op.gt]: afterDate });
    if (beforeDate) dateCondition.push({ [Op.lt]: beforeDate });
    const createdAtCondition = { [Op.and]: dateCondition };

    // GET MESSAGES
    const chatMessagesInstance = await ChatMessageModel.findAll({
      attributes: ['id', 'message', 'createdAt', 'readBy'],
      include: [{
        model: UserModel,
        as: 'sender',
        attributes: ['id', 'fullName', 'role'],
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      where: { createdAt: createdAtCondition, chatGroupId },
    });

    const chatMessagesData = chatMessagesInstance.map(message => {
      message = JSON.parse(JSON.stringify(message));
      const { readBy = [] } = message;
      message.hasRead = readBy.includes(userId);
      return message;
    });

    const chatMessagesId = map(chatMessagesInstance, 'id');

    // MARK MESSAGES AS READ
    ChatMessageModel.update(
      { readBy: sequelize.fn('array_append', sequelize.col('read_by'), userId) },
      {
        where: {
          chatGroupId,
          id: { [Op.in]: chatMessagesId },
          [Op.not]: { readBy: { [Op.contains]: [userId] } },
          senderId: { [Op.ne]: userId },
        },
      },
    );

    return { messagesCount, chatMessagesData };
  } catch (error) {
    chatsLogger(`Error from getting web chat messages service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getWebChatMessagesService;
