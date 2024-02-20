const invoiceKeyFieldResolver = require('./invoice-key-field-resolver');

const invoiceFieldResolver = {
  Invoice: {
    key: invoiceKeyFieldResolver,
  },
};

module.exports = invoiceFieldResolver;
