/* eslint-disable camelcase */
const axios = require('axios');
const { isEmpty } = require('lodash');

const { AWS: { BUCKET: { PRIVATE_BUCKET_NAME } }, INTERNAL_SERVER_SECRET_KEY } = require('../../../config/config');

const { REPORT_SERVER_URL } = require('../../../config/config');
const {
  REPORT_SERVER_ROUTES: { DEBIT_NOTE_ROUTE, CONVENIENCE_FEES_ROUTE }, INVOICE_CONTENT_TYPE, BOOKING_FEES, CONVENIENCE_FEES,
  TRANSACTION_COMPLETED, TRANSACTION_PENDING,
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  Event: EventModel, User: UserModel, Transaction: TransactionModel,
} = require('../../../sequelize-client');
const getObject = require('../../aws/functions/get-object');
const sendEmail = require('../../sendgrid');
const { RECRUITER_DEBIT_NOTE_AND_CONVENIENCE_FEES } = require('../constants/email-template-constants');

const sendEmailForDebitAndConvenienceInvoice = async eventId => {
  try {
    const event = await EventModel.findByPk(eventId, {
      attributes: ['name'],
      include: [
        {
          model: UserModel,
          as: 'recruiter',
          attributes: ['email', 'fullName'],
        },
        {
          model: TransactionModel,
          as: 'transactions',
          attributes: ['transactionType', 'transactionStatus'],
          where: { transactionType: [BOOKING_FEES, CONVENIENCE_FEES], transactionStatus: [TRANSACTION_COMPLETED, TRANSACTION_PENDING] },
          required: true,
        },
      ],
    });

    if (!isEmpty(event)) {
      const { name: eventName = '', recruiter: { email: recruiterEmail, fullName: recruiterName = '' } = {} } = event;

      const templateData = {
        templateKey: RECRUITER_DEBIT_NOTE_AND_CONVENIENCE_FEES,
        toEmailAddress: recruiterEmail,
        data: {
          recruiterName, eventName,
        },
        attachments: [],
      };

      try {
        const { data: axiosResponse = {} } = await axios.post(`${REPORT_SERVER_URL}${DEBIT_NOTE_ROUTE}`, {
          eventId,
        }, { headers: { internal_server_secret: INTERNAL_SERVER_SECRET_KEY } });
        const { data: { key = '' } = {} } = axiosResponse;
        const { Body: invoiceBufferData = '' } = await getObject(PRIVATE_BUCKET_NAME, key);
        if (invoiceBufferData) {
          templateData.attachments.push({
            content: invoiceBufferData.toString('base64'),
            filename: 'debit_note.pdf',
            type: INVOICE_CONTENT_TYPE,
            disposition: 'attachment',
          });
        }
      } catch (error) {
        defaultLogger(`Error while generating debit-note : ${error}`, null, 'error');
      }

      try {
        const { data: axiosResponse = {} } = await axios.post(`${REPORT_SERVER_URL}${CONVENIENCE_FEES_ROUTE}`, {
          eventId,
        }, { headers: { internal_server_secret: INTERNAL_SERVER_SECRET_KEY } });
        const { data: { key = '' } = {} } = axiosResponse;
        const { Body: invoiceBufferData = '' } = await getObject(PRIVATE_BUCKET_NAME, key);
        if (invoiceBufferData) {
          templateData.attachments.push({
            content: invoiceBufferData.toString('base64'),
            filename: 'convenience_fees.pdf',
            type: INVOICE_CONTENT_TYPE,
            disposition: 'attachment',
          });
        }
      } catch (error) {
        defaultLogger(`Error while generating convenience-fees : ${error}`, null, 'error');
      }

      sendEmail(templateData);
    }
  } catch (error) {
    defaultLogger(`Error from sendEmailForDebitAndConvenienceInvoice : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForDebitAndConvenienceInvoice;
