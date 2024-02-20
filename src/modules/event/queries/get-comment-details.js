/* eslint-disable security/detect-object-injection */
const { Op } = require('sequelize');

const eventLogger = require('../event-logger');

const getCommentDetails = async (_, args, ctx) => {
  try {
    const {
      models: {
        User: UserModel,
        Comments: CommentsModel,
      },
    } = ctx;

    const { eventId, userId } = args.data;

    let commentInstance = await CommentsModel.findAll({
      where: {
        eventId,
        [Op.or]: [
          {
            receiverId: userId,
          },
          {
            senderId: userId,
          },
        ],
      },
      attributes: ['id', 'message'],
      include: [
        {
          model: UserModel,
          as: 'sender',
          attributes: ['role'],
        },
      ],
    });

    commentInstance = JSON.parse(JSON.stringify(commentInstance));

    commentInstance.forEach((comment, i) => {
      const { sender } = comment;
      delete commentInstance[i].sender;
      commentInstance[i] = { ...commentInstance[i], ...sender };
    });
    return { comments: commentInstance };
  } catch (error) {
    eventLogger(`Error from get comment details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getCommentDetails;
