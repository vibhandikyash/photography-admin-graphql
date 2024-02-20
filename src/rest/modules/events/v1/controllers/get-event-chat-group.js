const chatConstants = require('../../../../../constants/chat-constants');
const { SUCCESS } = require('../../../../../constants/service-constants');
const {
  ChatGroup: ChatGroupModel,
  ChatMember: ChatMemberModel,
  Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');

const eventLogger = require('../../event-logger');

const getEventChatGroup = async (req, res, next) => {
  try {
    const { params: { eventId }, user: { id } } = req;
    const { type: { ONE_TO_ONE }, refType: { EVENT } } = chatConstants;
    // Query for fetch receiver id
    const receiverIdQuery = `(select user_id from chat_members where chat_group_id = "ChatGroup"."id" and user_id != '${id}')`;
    // Query for fetch unread message count
    const unreadMessagesCountQuery = `(select CAST(count(*) as integer) from chat_messages where chat_group_id = "ChatGroup"."id"
      and sender_id != '${id}' and not ('${id}' = any (read_by)))`;

    // get chat group with receiver id and unread message count by event
    const chatGroups = await ChatGroupModel.findAll(
      {
        attributes: [
          'id',
          [Sequelize.literal(receiverIdQuery), 'receiverId'],
          [Sequelize.literal(unreadMessagesCountQuery), 'unreadMessagesCount'],
        ],
        where: { refId: eventId, refType: EVENT, type: ONE_TO_ONE },
        include: {
          model: ChatMemberModel,
          as: 'chatMembers',
          attributes: [],
          where: { userId: id },
        },
      },
    );

    return sendSuccessResponse(res, SUCCESS, OK, chatGroups);
  } catch (error) {
    eventLogger(`Error from get-chat-group: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getEventChatGroup;
