
const defaultLogger = require('../../../logger');
const { User: UserModel } = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');

const { RECRUITER_PROFILE_ACTIVATED } = require('../constants/email-template-constants');

const sendEmailForRecruiterApprovedProfile = async userId => {
  try {
    const user = await UserModel.findByPk(userId, { attributes: ['fullName', 'email'] });
    const { email, fullName } = user;

    const templateData = {
      templateKey: RECRUITER_PROFILE_ACTIVATED,
      toEmailAddress: email,
      data: { userName: fullName },
    };

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForRecruiterApprovedProfile : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForRecruiterApprovedProfile;
