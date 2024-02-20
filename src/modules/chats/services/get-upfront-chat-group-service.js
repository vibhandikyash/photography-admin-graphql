const { map } = require('lodash');

const {
  models: { ChatGroup: ChatGroupModel, ChatMember: ChatMemberModel, User: UserModel },
} = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const chatsLogger = require('../chats-logger');

const getUpfrontChatGroupService = async (chatGroupId, localeService) => {
  try {
    const existingChatGroup = await ChatGroupModel.findByPk(chatGroupId);
    if (!existingChatGroup) {
      throw new CustomApolloError(getMessage('CHAT_GROUP_NOT_FOUND', localeService));
    }

    const chatGroupInstance = await ChatGroupModel.findByPk(chatGroupId, {
      include: [{
        model: ChatMemberModel,
        as: 'chatMembers',
        include: {
          model: UserModel,
          as: 'user',
        },
      }],
    });
    const { chatMembers } = chatGroupInstance;
    const chatUsers = map(chatMembers, 'user');
    chatGroupInstance.chatMembers = chatUsers;
    return chatGroupInstance;
  } catch (error) {
    chatsLogger(`Error from upfront chat group service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getUpfrontChatGroupService;
