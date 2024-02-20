const freelancerTrainingFees = require('./mutations/create-freelancer-training-fees-transaction');
const initialPaymentAndTopUpByRecruiter = require('./mutations/create-initial-payment-or-top-up-by-recruiter');
const createTopUpForRecruiter = require('./mutations/create-top-up-for-recruiter');
const waiveOffTransactionForCancellationAndConvenienceFees = require('./mutations/create-waive-off-transaction-for-cancellation-and-convenience');
const createWebTopUpRequest = require('./mutations/create-web-top-up-request');
const updatePaymentStatus = require('./mutations/update-payment-status');
const getCancellationOrConvenienceFeesForEvent = require('./queries/get-cancellation-or-convenience-fees-for-event');
const getFreelancerTransactionList = require('./queries/get-freelancer-transaction-list');
const getRecruiterAvailableBalance = require('./queries/get-recruiter-available-balance');
const getRecruiterTransactionList = require('./queries/get-recruiter-transaction-list');
const getRecruiterWebPaymentDetails = require('./queries/get-recruiter-web-payment-details');
const getTopUpTransactionList = require('./queries/get-top-up-transaction-list');
const getTransactionDetailsForEvent = require('./queries/get-transaction-details-for-event');
const getTransactionTypeList = require('./queries/get-transaction-type-list');
const sendEmailForExportFreelancerTransactions = require('./queries/send-email-for-export-freelancer-transactions');
const sendEmailForExportRecruiterTransactions = require('./queries/send-email-for-export-recruiter-transactions');
const sendEmailForExportTopUpTransactions = require('./queries/send-email-for-export-top-up-transactions');
const transactionFilters = require('./queries/transaction-filters');
const transactionFieldResolvers = require('./transaction-field-resolvers');

const resolvers = {
  ...transactionFieldResolvers,
  Query: {
    sendEmailForExportTopUpTransactions,
    sendEmailForExportRecruiterTransactions,
    sendEmailForExportFreelancerTransactions,
    getRecruiterWebPaymentDetails,
    getFreelancerTransactionList,
    getRecruiterTransactionList,
    getTransactionTypeList,
    getTransactionDetailsForEvent,
    getCancellationOrConvenienceFeesForEvent,
    transactionFilters,
    getRecruiterAvailableBalance,
    getTopUpTransactionList,
  },
  Mutation: {
    createWebTopUpRequest,
    initialPaymentAndTopUpByRecruiter,
    freelancerTrainingFees,
    updatePaymentStatus,
    waiveOffTransactionForCancellationAndConvenienceFees,
    createTopUpForRecruiter,
  },
};

module.exports = resolvers;
