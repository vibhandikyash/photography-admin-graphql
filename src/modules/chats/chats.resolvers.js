const chatGroup = require('./queries/chat-group');
const chatGroups = require('./queries/chat-groups');
const chatMessages = require('./queries/chat-messages');
const getFreelancerWebChatGroup = require('./queries/get-freelancer-web-chat-group');
const getRecruiterWebOrganicChatGroup = require('./queries/get-recruiter-web-organic-chat-group');
const getRecruiterWebUpfrontChatGroup = require('./queries/get-recruiter-web-upfront-chat-group');
const getRecruiterWebUpfrontChatGroups = require('./queries/get-recruiter-web-upfront-chat-groups');
const getWebChatMessages = require('./queries/get-web-chat-messages');

const resolvers = {
  Query: {
    chatGroup,
    chatGroups,
    chatMessages,
    getFreelancerWebChatGroup,
    getWebChatMessages,
    getRecruiterWebOrganicChatGroup,
    getRecruiterWebUpfrontChatGroups,
    getRecruiterWebUpfrontChatGroup,
  },
};

module.exports = resolvers;
