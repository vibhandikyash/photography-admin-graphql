
const defaultLogger = require('../../../logger');
const { Dispute: DisputeModel, Event: EventModel, User: UserModel } = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { DISPUTE_RAISED, DISPUTE_RAISED_FOR } = require('../constants/email-template-constants');

const sendEmailForDisputeRaised = async disputeId => {
  try {
    const disputeData = await DisputeModel.findByPk(disputeId, {
      attributes: ['ticketNo', 'message'],
      include: [
        { model: EventModel, as: 'event', attributes: ['name'] },
        { model: UserModel, as: 'user', attributes: ['fullName', 'email'] },
        { model: UserModel, as: 'creator', attributes: ['fullName', 'email'] },
      ],
    });

    const {
      ticketNo, message: concern,
      event: { name: eventName } = {},
      user: { fullName: disputeRaisedForName, email: disputeRaisedForEmail } = {},
      creator: { fullName: disputeRaisedByName, email: disputeRaisedByEmail } = {},
    } = disputeData;

    const templateData = {
      disputeRaisedByName, eventName, ticketNo, disputeRaisedForName, concern,
    };

    // send email for dispute raised
    const templateForDisputeRaised = {
      templateKey: DISPUTE_RAISED,
      toEmailAddress: disputeRaisedByEmail,
      data: templateData,
    };

    sendEmail(templateForDisputeRaised);

    // send email to inform dispute raised against user
    const templateForDisputeRaisedFor = {
      templateKey: DISPUTE_RAISED_FOR,
      toEmailAddress: disputeRaisedForEmail,
      data: templateData,
    };

    sendEmail(templateForDisputeRaisedFor);
  } catch (error) {
    defaultLogger(`Error from sendEmailForDisputeRaised : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForDisputeRaised;
