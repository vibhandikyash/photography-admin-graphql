const { CONTACT_INQUIRY_FORWARDING_EMAIL } = require('../../../config/config');
const { CONTACT_WEDLANCER } = require('../../../shared-lib/emails/constants/email-template-constants');
const sendEmail = require('../../../shared-lib/sendgrid');
const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const submitContactInquiry = async (_, args, ctx) => {
  try {
    const {
      data: {
        name, email, contactNo, note,
      } = null,
    } = args;
    const { localeService } = ctx;

    // SEND MAIL TO WEDLANCER
    const templateData = {
      templateKey: CONTACT_WEDLANCER,
      toEmailAddress: CONTACT_INQUIRY_FORWARDING_EMAIL,
      data: {
        name, email, contactNo, note,
      },
      replyToEmailAddress: email,
    };
    sendEmail(templateData);

    return { status: 'SUCCESS', message: getMessage('CONTACT_INQUIRY_SUCCESSFULLY_RECEIVED', localeService) };
  } catch (error) {
    userLogger(`Error from submitContactInquiry: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = submitContactInquiry;
