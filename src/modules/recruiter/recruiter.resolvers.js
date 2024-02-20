const recruiterFieldResolvers = require('./field-resolvers.js/recruiter-field-resolvers');
const createRecruiter = require('./mutations/create-recruiter');
const createRecruiterProfile = require('./mutations/create-recruiter-profile');
const removeRecruiter = require('./mutations/remove-recruiter');
const updateRecruiterDetails = require('./mutations/update-recruiter-details');
const updateRecruiterWebDetails = require('./mutations/update-recruiter-web-details');
const updateRecruiterWebProfileDetails = require('./mutations/update-recruiter-web-profile-details');
const getRecruiterDetails = require('./queries/get-recruiter-details');
const getRecruiterUpcomingEvents = require('./queries/get-recruiter-upcoming-events');
const getRecruiterWebDetails = require('./queries/get-recruiter-web-details');
const getRecruiterWebProfileDetails = require('./queries/get-recruiter-web-profile-details');
const listRecruiters = require('./queries/list-recruiters');
const recruiterDashboardDetails = require('./queries/recruiter-dashboard-details');
const recruiterPaymentList = require('./queries/recruiter-payment-list');
const recruiterServiceList = require('./queries/recruiter-service-list');
const sendEmailForExportRecruiters = require('./queries/send-email-for-export-recruiters');

const resolvers = {
  ...recruiterFieldResolvers,
  Mutation: {
    updateRecruiterWebProfileDetails,
    updateRecruiterWebDetails,
    createRecruiter,
    updateRecruiterDetails,
    removeRecruiter,
    createRecruiterProfile,
  },
  Query: {
    sendEmailForExportRecruiters,
    getRecruiterWebProfileDetails,
    getRecruiterWebDetails,
    recruiterDashboardDetails,
    getRecruiterDetails,
    getRecruiterUpcomingEvents,
    listRecruiters,
    recruiterPaymentList,
    recruiterServiceList,
  },
};

module.exports = resolvers;
