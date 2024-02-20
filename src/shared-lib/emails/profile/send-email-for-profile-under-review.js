
const defaultLogger = require('../../../logger');
const { User: UserModel } = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');

const { PROFILE_UNDER_REVIEW } = require('../constants/email-template-constants');

const sendEmailForProfileUnderReview = async userId => {
  try {
    const user = await UserModel.findByPk(userId, { attributes: ['fullName', 'email'] });
    const { email, fullName } = user;

    const templateData = {
      templateKey: PROFILE_UNDER_REVIEW,
      toEmailAddress: email,
      data: { userName: fullName },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForProfileUnderReview : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForProfileUnderReview;
