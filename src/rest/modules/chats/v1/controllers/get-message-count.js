const { SUCCESS } = require('../../../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');
const chatLogger = require('../../chats-logger');

const getMessageCount = async (req, res, next) => {
  try {
    const { user: { id: userId }, params: { chatGroupId }, query: { unread = 'false' } } = req;

    // if unread is true then fetch only unread messages count else fetch all messages count
    const messagesCountQuery = `select CAST(count(*) as integer) from chat_messages where chat_group_id = :chatGroupId
    ${unread === 'true' ? 'and sender_id != :userId and not (:userId = any (read_by))' : ''}`;

    const replacements = { chatGroupId, userId };

    // get message count
    const messageCount = await sequelize.query(messagesCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    return sendSuccessResponse(res, SUCCESS, OK, { messageCount: messageCount[0].count });
  } catch (error) {
    chatLogger(`Error from message-count: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getMessageCount;
