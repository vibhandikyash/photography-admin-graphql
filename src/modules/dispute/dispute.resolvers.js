const createFreelancerDispute = require('./mutations/create-freelancer-dispute');
const createRecruiterDispute = require('./mutations/create-recruiter-dispute');
const getFreelancerWebEventDispute = require('./queries/get-freelancer-web-event-dispute');
const getRecruiterWebEventDispute = require('./queries/get-recruiter-web-event-dispute');
const sendEmailForExportDispute = require('./queries/send-email-for-export-dispute');

const resolvers = {
  Mutation: {
    createRecruiterDispute,
    createFreelancerDispute,
  },
  Query: {
    getFreelancerWebEventDispute,
    getRecruiterWebEventDispute,
    sendEmailForExportDispute,
  },
};

module.exports = resolvers;
