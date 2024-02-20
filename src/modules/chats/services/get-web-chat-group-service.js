/* eslint-disable no-restricted-syntax */
const {
  models: { ChatGroup: ChatGroupModel, ChatMember: ChatMemberModel, User: UserModel },
} = require('../../../sequelize-client');
const chatsLogger = require('../chats-logger');

const getWebChatGroupService = async eventId => {
  try {
    const chatGroupInstance = await ChatGroupModel.findAll({
      where: { refId: eventId },
      include: [{
        model: ChatMemberModel,
        as: 'chatMembers',
        include: {
          model: UserModel,
          as: 'user',
        },
      }],
    });

    const chatGroupsData = [];
    for (const chatGroup of chatGroupInstance) {
      const { chatMembers } = chatGroup;
      const chatMembersData = [];
      for (const member of chatMembers) {
        const { user } = member;
        chatMembersData.push(user);
      }
      chatGroup.chatMembers = chatMembersData;
      chatGroupsData.push(chatGroup);
    }

    return chatGroupsData;
  } catch (error) {
    chatsLogger(`Error from getting web chat group service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getWebChatGroupService;
