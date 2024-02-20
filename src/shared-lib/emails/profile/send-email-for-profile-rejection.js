
const defaultLogger = require('../../../logger');
const { User: UserModel } = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');

const { PROFILE_REJECTION } = require('../constants/email-template-constants');

const sendEmailForProfileRejection = async userId => {
  try {
    const user = await UserModel.findByPk(userId, { attributes: ['fullName', 'email'] });
    const { email, fullName } = user;

    const templateData = {
      templateKey: PROFILE_REJECTION,
      toEmailAddress: email,
      data: { userName: fullName },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForProfileRejection : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForProfileRejection;
