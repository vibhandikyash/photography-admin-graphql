const fs = require('fs');

const path = require('path');

const handlebars = require('handlebars');
const moment = require('moment');

const { Op } = require('sequelize');

const { RESET_EXPIRY_TIME, APP_URL } = require('../../../config/config');
const sendRawEmail = require('../../../shared-lib/emails/emails/methods/send-email');
const { CustomApolloError } = require('../../../shared-lib/error-handler/custom-apollo-error');
const { randomString } = require('../../../utils/auth/generate-password');
const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const templatePath = '../email-templates/forgot-password.handlebars';

const forgotUserPassword = async (_, args, ctx) => {
  try {
    const {
      where: { email },
    } = args;
    const {
      models: {
        User: UserModel,
      },
      localeService,
    } = ctx;

    if (!email) throw new CustomApolloError(getMessage('EMAIL_REQUIRED', localeService));

    const userInstance = await UserModel.findOne({ where: { email: { [Op.iLike]: email }, accountDeletedAt: null } });
    if (!userInstance) {
      return new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }

    if (!userInstance.isActive) {
      return new CustomApolloError(getMessage('USER_DISABLED', localeService));
    }

    const resetToken = randomString(64);
    const patchData = {
      resetToken,
      resetTokenExpiry: moment().add(RESET_EXPIRY_TIME, 'minutes').toISOString(),
    };
    await UserModel.update(patchData, { where: { id: userInstance.id } });

    const dataToSend = {
      name: userInstance.userName,
      url: `${APP_URL}/reset-password?uid=${userInstance.id}&token=${resetToken}`,
      currentYear: moment().format('YYYY'),
    };
    const compiledContentTemplate = handlebars.compile(fs.readFileSync(path.resolve(__dirname, templatePath), 'utf8'));
    const contentString = compiledContentTemplate(dataToSend);

    const emailData = {
      subject: `RESET PASSWORD for wedlancer requested by ${userInstance.name}`,
      body: contentString,
      toEmailAddresses: [userInstance.email],
      fromName: userInstance.userName,
    };
    await sendRawEmail(emailData);

    const response = {
      status: 'SUCCESS',
      message: getMessage('RESET_EMAIL_SENT_SUCCESSFULLY', localeService),
    };
    return response;
  } catch (error) {
    userLogger(`Error while forgot user password : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = forgotUserPassword;
