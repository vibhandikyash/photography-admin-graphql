const { Op } = require('sequelize');

const { QUERY_PAGING_MAX_COUNT, QUERY_PAGING_MIN_COUNT } = require('../../../../../config/config');
const { SUCCESS } = require('../../../../../constants/service-constants');
const {
  User: UserModel,
  ChatMessage: ChatMessageModel,
  ChatGroup: ChatGroupModel,
  sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');
const chatLogger = require('../../chats-logger');

const viewChat = async (req, res, next) => {
  try {
    let { query: { limit = QUERY_PAGING_MIN_COUNT } } = req;
    const {
      query: {
        skip: offset = 0, before, after, markAllMessagesAsRead,
      },
      params: { chatGroupId },
      user: { id },
    } = req;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    // get message count per group Id
    const messageCount = await ChatMessageModel.count({ where: { chatGroupId } });

    // made condition for createdAt
    const dateCondition = [];
    if (after) dateCondition.push({ [Op.gt]: after });
    if (before) dateCondition.push({ [Op.lt]: before });
    const createdAtCondition = { [Op.and]: dateCondition };

    // get messages
    const [chatGroup] = await ChatGroupModel.findAll({
      attributes: ['id', 'name', 'createdAt'],
      include: [
        {
          model: ChatMessageModel,
          as: 'chatMessages',
          attributes: ['id', 'message', 'createdAt', 'readBy'],
          include: [
            {
              model: UserModel,
              as: 'sender',
              attributes: ['id', 'fullName'],
            },
          ],
          order: [
            ['createdAt', 'DESC'],
          ],
          offset,
          limit,
          where: {
            createdAt: createdAtCondition,
          },
        },
        {
          model: UserModel,
          as: 'creator',
          attributes: ['id', 'fullName'],
        },
      ],
      where: { id: chatGroupId },
    });

    const whereConditionForReadMessage = {
      chatGroupId,
      [Op.not]: {
        readBy: {
          [Op.contains]: [id],
        },
      },
      senderId: {
        [Op.ne]: id,
      },
    };

    if (markAllMessagesAsRead !== 'true') {
      // fetch messages id
      let chatMessagesId = [];
      if (chatGroup) {
        chatMessagesId = chatGroup.chatMessages.map(chatMessage => chatMessage.id);
      }
      whereConditionForReadMessage.id = { [Op.in]: chatMessagesId };
    }

    // mark messages as read
    ChatMessageModel.update(
      { readBy: sequelize.fn('array_append', sequelize.col('read_by'), id) },
      { where: whereConditionForReadMessage },
    );

    return sendSuccessResponse(res, SUCCESS, OK, { messageCount, chatGroup });
  } catch (error) {
    chatLogger(`Error from send-message: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = viewChat;
