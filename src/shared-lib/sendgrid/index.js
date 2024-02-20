/* eslint-disable camelcase */

const sgMail = require('@sendgrid/mail');
const { compile } = require('handlebars');

const { SEND_GRID } = require('../../config/config');
const defaultLogger = require('../../logger');

sgMail.setApiKey(SEND_GRID.PASSWORD);

const createMailReqObject = templateData => {
  const {
    templateString = '', data = {}, templateKey, toEmailAddress, replyToEmailAddress = null,
  } = templateData;
  const template = compile(templateString);
  const templateBody = template(data);
  const mailRequest = {
    templateId: templateKey,
    to: {
      email: toEmailAddress,
    },
    from: {
      email: SEND_GRID.FROM_EMAIL,
      name: SEND_GRID.FROM_NAME,
    },
    dynamic_template_data: {
      ...data,
      html: templateBody,
    },
  };
  if (replyToEmailAddress) {
    mailRequest.replyTo = {
      email: replyToEmailAddress,
    };
  }
  defaultLogger(`EMAIL REQ OBJ >>> ${mailRequest}`);
  return mailRequest;
};

const sendEmail = async (templateData = {}) => new Promise((resolve, reject) => {
  const mailOptions = createMailReqObject(templateData);
  if (templateData.attachments && templateData.attachments.length) {
    mailOptions.attachments = templateData.attachments;
  }
  sgMail
    .send(mailOptions)
    .then(response => {
      defaultLogger(`EMAIL SENT SUCCESSFULLY >>> ${JSON.stringify(response)}`);
      return resolve(response);
    })
    .catch(error => {
      defaultLogger(`ERROR WHILE SEND EMAIL >>> ${JSON.stringify(error)}`, null, 'error');
      return reject(error);
    });
});

module.exports = sendEmail;
