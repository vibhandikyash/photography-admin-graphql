
const eventFieldResolvers = require('./field-resolvers/event-field-resolvers');
const { assignFreelancerToEvent } = require('./mutations/assign-freelancer-to-event');
const cancelEvent = require('./mutations/cancel-event');
const cancelWebEvent = require('./mutations/cancel-web-event');

const createEventTimings = require('./mutations/create-event-timings');
const createFreelancerWebEventReview = require('./mutations/create-freelancer-web-event-review');
const createOrganicEvent = require('./mutations/create-organic-event');
const createRecruiterWebEventReview = require('./mutations/create-recruiter-web-event-review');
const createWebEventTimings = require('./mutations/create-web-event-timings');
const createWebOrganicEvent = require('./mutations/create-web-organic-event');
const createWebUpfrontEvent = require('./mutations/create-web-upfront-event');
const organicFreelancerAssignment = require('./mutations/organic-freelancer-assignment');
const removeFreelancerFromEvent = require('./mutations/remove-freelancer-from-event');
const updateAttendanceLog = require('./mutations/update-attendance-log');
const updateEventStatus = require('./mutations/update-event-status');
const updateEventTimings = require('./mutations/update-event-timings');
const updateIssueStatus = require('./mutations/update-issue-status');
const updateOrganicEvent = require('./mutations/update-organic-event');
const updateUserReviewStatus = require('./mutations/update-user-review-status');
const eventFilters = require('./queries/event-filters');
const getAssignedFreelancerDetails = require('./queries/get-assigned-freelancer-details');
const getEventDetails = require('./queries/get-event-details');
const getEventFreelancers = require('./queries/get-event-freelancers');
const getEventList = require('./queries/get-event-list');
const getFreelancerAvailabilityList = require('./queries/get-freelancer-availability-list');
const getFreelancerWebAttendanceLogs = require('./queries/get-freelancer-web-attendance-logs');
const getFreelancerWebAttendanceLogsForRecruiter = require('./queries/get-freelancer-web-attendance-logs-for-recruiter');
const getFreelancerWebEvent = require('./queries/get-freelancer-web-event');
const getFreelancerWebEventFees = require('./queries/get-freelancer-web-event-fees');
const getFreelancerWebEventReviews = require('./queries/get-freelancer-web-event-reviews');
const getIssueDetails = require('./queries/get-issue-details');
const getOrganicEventWebFreelancer = require('./queries/get-organic-event-web-freelancer');
const getRecruiterWebEvent = require('./queries/get-recruiter-web-event');
const getRecruiterWebEventFees = require('./queries/get-recruiter-web-event-fees');
const getRecruiterWebEventReviews = require('./queries/get-recruiter-web-event-reviews');
const getWebUpfrontCategoryFreelancer = require('./queries/get-web-upfront-category-freelancer');
const issueFilters = require('./queries/issue-filters');
const listIssues = require('./queries/issues-list');
const listComments = require('./queries/list-comments');
const listFreelancerWebEvents = require('./queries/list-freelancer-web-events');
const listRecruiterWebEvents = require('./queries/list-recruiter-web-events');
const sendEmailForExportEvents = require('./queries/send-email-for-export-events');

const resolvers = {
  ...eventFieldResolvers,
  Query: {
    sendEmailForExportEvents,
    getEventFreelancers,
    getRecruiterWebEventReviews,
    getOrganicEventWebFreelancer,
    getRecruiterWebEventFees,
    getFreelancerWebAttendanceLogsForRecruiter,
    getWebUpfrontCategoryFreelancer,
    getRecruiterWebEvent,
    listRecruiterWebEvents,
    getFreelancerWebEventReviews,
    getFreelancerWebEventFees,
    getFreelancerWebAttendanceLogs,
    getFreelancerWebEvent,
    listFreelancerWebEvents,
    getEventList,
    getFreelancerAvailabilityList,
    listIssues,
    getIssueDetails,
    listComments,
    issueFilters,
    getEventDetails,
    eventFilters,
    getAssignedFreelancerDetails,
  },
  Mutation: {
    cancelWebEvent,
    createWebOrganicEvent,
    createWebUpfrontEvent,
    createWebEventTimings,
    createFreelancerWebEventReview,
    createRecruiterWebEventReview,
    removeFreelancerFromEvent,
    cancelEvent,
    assignFreelancerToEvent,
    createOrganicEvent,
    updateOrganicEvent,
    organicFreelancerAssignment,
    updateAttendanceLog,
    updateIssueStatus,
    updateEventTimings,
    updateEventStatus,
    updateUserReviewStatus,
    createEventTimings,
  },
};

module.exports = resolvers;
