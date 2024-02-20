const { validationResult } = require('express-validator');
const { map, includes } = require('lodash');
const moment = require('moment');

const { SUCCESS, CHAT_MESSAGE_VALIDITY_IN_HOURS } = require('../../../../../constants/service-constants');
const {
  Event: EventModel, ChatGroup: ChatGroupModel, ChatMember: ChatMemberModel, ChatMessage: ChatMessageModel,
} = require('../../../../../sequelize-client');
const createNotificationForChatMessages = require('../../../../../shared-lib/notifications/chats/create-notification-for-chat-messages');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const { ApiError } = require('../../../../services/custom-api-error');
const { OK, BAD_REQUEST, VALIDATION_FAILED } = require('../../../../services/http-status-codes');
const chatLogger = require('../../chats-logger');

const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }
    const {
      body: { message }, user: { id: senderId }, params: { chatGroupId }, localeService,
    } = req;
    // check chat group exist or not
    const chatGroup = await ChatGroupModel.findByPk(chatGroupId, {
      attributes: ['id', 'refId'],
      include: {
        model: ChatMemberModel,
        as: 'chatMembers',
        attributes: ['userId'],
      },
    });
    const { refId: eventId } = chatGroup;
    const event = await EventModel.findByPk(eventId);
    const { endDate } = event;
    const currentDate = moment().format();
    const daysDiff = moment(currentDate).diff(endDate, 'hours');
    if (daysDiff > CHAT_MESSAGE_VALIDITY_IN_HOURS) {
      throw new ApiError(getMessage('NOT_ALLOWED_TO_SEND_MESSAGE', localeService, { chatMessageValidityInHours: CHAT_MESSAGE_VALIDITY_IN_HOURS }));
    }
    if (!chatGroup) {
      throw new ApiError(getMessage('CHAT_GROUP_NOT_FOUND'), BAD_REQUEST);
    }

    const chatMemberIds = map(chatGroup.chatMembers, 'userId');
    const receiverIds = chatMemberIds.filter(chatMemberId => chatMemberId !== senderId);

    // check sender is in group or not
    if (!includes(chatMemberIds, senderId)) {
      throw new ApiError(getMessage('NOT_MEMBER_OF_CHAT_GROUP'), BAD_REQUEST);
    }

    // create message
    await ChatMessageModel.create({ senderId, chatGroupId, message });
    if (receiverIds.length) {
      const { refId } = chatGroup;
      createNotificationForChatMessages(chatGroupId, refId, message, receiverIds, senderId, localeService);
    }
    return sendSuccessResponse(res, SUCCESS, OK);
  } catch (error) {
    chatLogger(`Error from send-message: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = sendMessage;
