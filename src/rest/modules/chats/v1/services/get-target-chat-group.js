const { filter, intersection } = require('lodash');

const chatConstants = require('../../../../../constants/chat-constants');
const {
  ChatGroup: ChatGroupModel,
  Sequelize,
} = require('../../../../../sequelize-client');
const chatLogger = require('../../chats-logger');

const getTargetChatGroup = async (eventId, senderId, receiverId) => {
  try {
    const { type: { ONE_TO_ONE }, refType: { EVENT } } = chatConstants;

    // get chat groups by event
    const chatGroups = await ChatGroupModel.findAll(
      {
        attributes: [
          'id',
          [Sequelize.literal(`(select array_agg(user_id) from chat_members
              where chat_group_id = "ChatGroup"."id" and user_id in ('${senderId}', '${receiverId}'))`), 'memberIds'],
        ],
        where: { refId: eventId, refType: EVENT, type: ONE_TO_ONE },
        raw: true,
      },
    );

    // get check group if it have both(sendId, receiverId) in userId
    const [targetChatGroup] = filter(chatGroups, ((chatGroup = {}) => {
      const { memberIds = [] } = chatGroup;
      return intersection(memberIds, [receiverId, senderId]).length === 2;
    }));

    return targetChatGroup;
  } catch (error) {
    chatLogger(`Error from get-target-chat-group: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getTargetChatGroup;
