const { WEB_URL } = require('../../../config/config');
const defaultLogger = require('../../../logger');
const { User: UserModel } = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { REGISTRATION_SUCCESSFUL } = require('../constants/email-template-constants');

const sendEmailForRegistration = async userId => {
  try {
    const user = await UserModel.findByPk(userId, { attributes: ['email', 'contactNo'] });
    const { email, contactNo } = user;

    const templateData = {
      templateKey: REGISTRATION_SUCCESSFUL,
      toEmailAddress: email,
      data: { profileCompletionLink: `${WEB_URL}verify/?contact=${contactNo}` },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForRegistration : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForRegistration;
