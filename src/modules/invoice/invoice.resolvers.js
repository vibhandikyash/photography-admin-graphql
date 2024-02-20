const invoiceFieldResolver = require('./field-resolvers/invoice-field-resolver');
const eventInvoiceList = require('./queries/event-invoice-list');

const resolvers = {
  ...invoiceFieldResolver,
  Query: {
    eventInvoiceList,
  },
};

module.exports = resolvers;
