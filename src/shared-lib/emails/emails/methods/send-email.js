const nodemailer = require('nodemailer');

const CONFIG = require('../../../../config/config');
const { logger } = require('../../../../logger');

/**
 *
 * @param {data} object should contain below fields
 *  {fromEmail}
 *  {subject}
 *  {toEmailAddresses}
 *  {html}
 *  {data} as in JSON object of variable data
 *
 */
const sendEmail = async (data = {}) => {
  try {
    const params = {
      from: CONFIG.SEND_GRID.FROM_EMAIL,
      to: data.toEmailAddresses,
      subject: data.subject,
      html: data.body,
    };

    const smtpConfigs = {
      host: CONFIG.SEND_GRID.HOST,
      port: CONFIG.SEND_GRID.PORT,
      auth: {
        user: CONFIG.SEND_GRID.USERNAME,
        pass: CONFIG.SEND_GRID.PASSWORD,
      },
    };

    const transporter = nodemailer.createTransport(smtpConfigs);

    const response = await transporter.sendMail(params);
    logger.info(`sendEmail: Email sent to ${data.toEmailAddresses} successfully messageId: ${response.messageId}`);
    return response;
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

// for testing uncomment the below line
// sendEmail();

module.exports = sendEmail;
