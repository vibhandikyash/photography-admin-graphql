const {
  Dispute: DisputeModel,
} = require('../../sequelize-client');

// get the last ticket number & generate a next issue number
const getNextTicketNo = async () => {
  const prevTicket = await DisputeModel.findOne({
    order: [['ticketNo', 'DESC']],
    paranoid: false,
  });
  let ticketNo;
  if (prevTicket) {
    ticketNo = prevTicket.ticketNo + 1;
  } else {
    ticketNo = 1;
  }

  return ticketNo;
};

module.exports = getNextTicketNo;
