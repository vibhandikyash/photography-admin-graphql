
const defaultLogger = require('../../../logger');
const { TopUpRequest: TopUpRequestModel, User: UserModel, UserBusiness: UserBusinessModel } = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { TOP_UP_REQUEST_APPROVED } = require('../constants/email-template-constants');

const sendEmailForTopUpRequestApproved = async topUpRequestId => {
  try {
    const topUpRequest = await TopUpRequestModel.findByPk(topUpRequestId, {
      attributes: ['amount'],
      include: [
        {
          model: UserModel,
          as: 'sender',
          attributes: ['fullName', 'email'],
        },
        {
          model: UserModel,
          as: 'receiver',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
    });
    const {
      amount,
      sender: { fullName: senderName, email: senderEmail },
      receiver: { id: receiverId, fullName: receiverName, email: receiverEmail },
    } = topUpRequest;

    // fetch total balance
    const { totalBalance: updatedWalletBalance } = await UserBusinessModel.findOne({ where: { userId: receiverId }, attributes: ['totalBalance'] });

    // send email to sender
    let templateData = {
      templateKey: TOP_UP_REQUEST_APPROVED,
      toEmailAddress: senderEmail,
      data: { amount, userName: senderName, receiverName },
    };

    sendEmail(templateData);

    // send email to receiver
    templateData = {
      templateKey: TOP_UP_REQUEST_APPROVED,
      toEmailAddress: receiverEmail,
      data: {
        amount, userName: receiverName, senderName, updatedWalletBalance,
      },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForTopUpRequestApproved : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForTopUpRequestApproved;
