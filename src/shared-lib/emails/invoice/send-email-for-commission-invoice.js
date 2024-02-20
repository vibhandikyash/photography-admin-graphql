/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const axios = require('axios');

const { AWS: { BUCKET: { PRIVATE_BUCKET_NAME } }, INTERNAL_SERVER_SECRET_KEY } = require('../../../config/config');

const { REPORT_SERVER_URL } = require('../../../config/config');
const {
  REPORT_SERVER_ROUTES: { COMMISSION_ROUTE }, INVOICE_CONTENT_TYPE, FREELANCER_TYPE: { WEDLANCER_ASSURED },
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const {
  Event: EventModel, EventFreelancer: EventFreelancerModel, User: UserModel, UserProfile: UserProfileModel,
} = require('../../../sequelize-client');
const getObject = require('../../aws/functions/get-object');
const sendEmail = require('../../sendgrid');
const { FREELANCER_COMMISSION_INVOICE } = require('../constants/email-template-constants');

const sendEmailForCommissionInvoice = async eventId => {
  try {
    const event = await EventModel.findByPk(eventId, {
      attributes: ['name'],
      include: {
        model: EventFreelancerModel,
        as: 'freelancers',
        where: { isAssigned: true },
        required: true,
        attributes: ['id', 'userId'],
        include: [{
          model: UserModel,
          as: 'eventFreelancers',
          attributes: ['id', 'email', 'fullName'],
          include: {
            model: UserProfileModel,
            as: 'profile',
            where: { typeKey: WEDLANCER_ASSURED },
            attributes: ['typeKey'],
            required: true,
          },
        }],
      },
    });
    const { name: eventName = '', freelancers = [] } = event;

    for (const freelancer of freelancers) {
      if (freelancer.eventFreelancers) {
        const { eventFreelancers: { id: freelancerId, email: freelancerEmail, fullName: freelancerName } = {} } = freelancer;
        const templateData = {
          templateKey: FREELANCER_COMMISSION_INVOICE,
          toEmailAddress: freelancerEmail,
          data: {
            freelancerName, eventName,
          },
          attachments: [],
        };

        try {
          const { data: axiosResponse = {} } = await axios.post(`${REPORT_SERVER_URL}${COMMISSION_ROUTE}`, {
            eventId,
            freelancerId,
          }, { headers: { internal_server_secret: INTERNAL_SERVER_SECRET_KEY } });
          const { data: { key = '' } = {} } = axiosResponse;
          const { Body: invoiceBufferData = '' } = await getObject(PRIVATE_BUCKET_NAME, key);
          if (invoiceBufferData) {
            templateData.attachments.push({
              content: invoiceBufferData.toString('base64'),
              filename: 'invoice.pdf',
              type: INVOICE_CONTENT_TYPE,
              disposition: 'attachment',
            });
          }
          sendEmail(templateData);
        } catch (error) {
          defaultLogger(`Error while generating commission invoice: ${error}`, null, 'error');
        }
      }
    }
  } catch (error) {
    defaultLogger(`Error from sendEmailForCommissionInvoice : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForCommissionInvoice;
