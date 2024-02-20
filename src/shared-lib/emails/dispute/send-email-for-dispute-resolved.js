const { DEFAULT_TIMEZONE } = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const { Dispute: DisputeModel, Event: EventModel, User: UserModel } = require('../../../sequelize-client');
const sendEmail = require('../../sendgrid');
const { DISPUTE_RESOLVED, DISPUTE_RESOLVED_FOR } = require('../constants/email-template-constants');
const formatEmailDateWithTimeZone = require('../services/format-email-date-with-time-zone');

const sendEmailForDisputeResolved = async disputeId => {
  try {
    const dispute = await DisputeModel.findOne({
      attributes: ['ticketNo', 'resolution'],
      where: { id: disputeId },
      include: [
        { model: EventModel, as: 'event', attributes: ['name', 'startDate', 'timeZone'] },
        { model: UserModel, as: 'user', attributes: ['fullName', 'email'] },
        { model: UserModel, as: 'creator', attributes: ['fullName', 'email'] },
      ],
    });

    const {
      ticketNo, resolution,
      event: { name: eventName, startDate, timeZone = DEFAULT_TIMEZONE } = {},
      user: { fullName: disputeRaisedForName, email: disputeRaisedForEmail } = {},
      creator: { fullName: disputeRaisedByName, email: disputeRaisedByEmail } = {},
    } = dispute;

    const templateData = {
      disputeRaisedByName,
      eventName,
      ticketNo,
      disputeRaisedForName,
      resolution,
      eventStartDate: formatEmailDateWithTimeZone(startDate, timeZone),
    };

    // send email for dispute resolved
    const templateForDisputeResolved = {
      templateKey: DISPUTE_RESOLVED,
      toEmailAddress: disputeRaisedByEmail,
      data: templateData,
    };

    sendEmail(templateForDisputeResolved);

    // send email to inform dispute raised against user is resolved
    const templateForDisputeResolvedFor = {
      templateKey: DISPUTE_RESOLVED_FOR,
      toEmailAddress: disputeRaisedForEmail,
      data: templateData,
    };

    sendEmail(templateForDisputeResolvedFor);
  } catch (error) {
    defaultLogger(`Error from sendEmailForDisputeResolved : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForDisputeResolved;
