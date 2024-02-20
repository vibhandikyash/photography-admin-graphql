
const defaultLogger = require('../../../logger');
const { User: UserModel } = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { EMAIL_VERIFICATION } = require('../constants/email-template-constants');

const sendEmailForEmailVerification = async userId => {
  try {
    const user = await UserModel.findByPk(userId, { attributes: ['fullName', 'email'] });
    const { fullName, email } = user;

    const templateData = {
      templateKey: EMAIL_VERIFICATION,
      toEmailAddress: email,
      // TODO need to update confirmationLink
      data: { userName: fullName, confirmationLink: '#' },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForEmailVerification : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForEmailVerification;
