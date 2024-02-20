const chatConstants = require('../../../../../constants/chat-constants');
const { SUCCESS } = require('../../../../../constants/service-constants');
const {
  ChatGroup: ChatGroupModel,
  ChatMember: ChatMemberModel,
  Sequelize,
  sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');
const chatLogger = require('../../chats-logger');
const getTargetChatGroup = require('../services/get-target-chat-group');

const createChat = async (req, res, next) => {
  let transaction;
  try {
    const { type: { ONE_TO_ONE }, refType: { EVENT } } = chatConstants;
    const {
      body: { eventId, receiverId },
      user: { id: senderId },
    } = req;

    // check chat group exist or not
    const targetChatGroup = await getTargetChatGroup(eventId, senderId, receiverId);

    if (targetChatGroup) {
      return sendSuccessResponse(res, 'SUCCESS', OK, { chatGroupId: targetChatGroup.id });
    }

    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    // create new chat group
    const newChatGroupData = {
      type: ONE_TO_ONE,
      refId: eventId,
      refType: EVENT,
      createdBy: senderId,
    };
    const { id: chatGroupId } = await ChatGroupModel.create(newChatGroupData, { transaction });

    // create chat members
    const chatMembers = [
      { userId: senderId, chatGroupId },
      { userId: receiverId, chatGroupId },
    ];
    await ChatMemberModel.bulkCreate(chatMembers, { transaction });

    await transaction.commit();

    return sendSuccessResponse(res, SUCCESS, OK, { chatGroupId });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    chatLogger(`Error from create-chat-group: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = createChat;
