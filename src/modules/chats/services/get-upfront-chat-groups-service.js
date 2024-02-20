/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { isEmpty } = require('lodash');
const sequelize = require('sequelize');

const chatConstants = require('../../../constants/chat-constants');
const {
  models: {
    ChatGroup: ChatGroupModel, ChatMember: ChatMemberModel, User: UserModel, UserBusiness: UserBusinessModel, UserProfile: UserProfileModel,
    Category: CategoryModel, Event: EventModel,
  },
} = require('../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const chatsLogger = require('../chats-logger');

const getUpfrontChatGroupsService = async (eventId, userId, limit, offset, localeService) => {
  try {
    const existingEvent = await EventModel.findByPk(eventId);
    if (!existingEvent) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const { type: { ONE_TO_ONE }, refType: { EVENT } } = chatConstants;

    // QUERY FOR FETCH UNREAD MESSAGE COUNT
    const unreadMessagesCountQuery = `(select CAST(count(*) as integer) from chat_messages where chat_group_id = "ChatGroup"."id"
      and sender_id != '${userId}' and not ('${userId}' = any (read_by)))`;

    // GET CHAT GROUP WITH RECEIVER ID AND UNREAD MESSAGE COUNT BY EVENT
    let chatGroupsInstance = await ChatGroupModel.findAll(
      {
        attributes: ['id', [sequelize.literal(unreadMessagesCountQuery), 'unreadMessagesCount']],
        where: { refId: eventId, refType: EVENT, type: ONE_TO_ONE },
        limit,
        offset,
        include: {
          model: ChatMemberModel,
          as: 'chatMembers',
          include: [{
            model: UserModel,
            as: 'user',
            attributes: ['id', 'fullName', 'role'],
            include: [{
              model: UserBusinessModel,
              as: 'business',
              attributes: ['categoryId'],
              include: {
                model: CategoryModel,
                as: 'userCategory',
                attributes: ['name'],
              },
            },
            {
              model: UserProfileModel,
              as: 'profile',
              attributes: ['profilePhoto'],
            }],
          }],
        },
      },
    );
    chatGroupsInstance = JSON.parse(JSON.stringify(chatGroupsInstance));
    const chatGroupsData = [];
    for (const chatGroup of chatGroupsInstance) {
      const { id, unreadMessagesCount, chatMembers } = chatGroup;
      const chatMembersData = [];
      for (const member of chatMembers) {
        if (!isEmpty(member.user)) {
          const {
            user: {
              id: freelancerId, fullName, role, business: { userCategory = {} } = {},
            } = {},
          } = member;
          const categoryName = userCategory?.name;
          let { user: { profile: { profilePhoto } = {} } } = member;

          if (profilePhoto) {
            [profilePhoto] = await getKeysAndGenerateUrl([profilePhoto]);
          }
          const user = {
            id: freelancerId, fullName, profilePhoto, categoryName, role,
          };
          chatMembersData.push(user);
        }
      }
      const chatData = { id, unreadMessagesCount, chatMembers: chatMembersData };
      chatGroupsData.push(chatData);
    }

    return { chatGroupsData, count: chatGroupsInstance.length };
  } catch (error) {
    chatsLogger(`Error from getting upfront chat groups service: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getUpfrontChatGroupsService;
