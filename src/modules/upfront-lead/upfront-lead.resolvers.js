const createUpfrontLead = require('./mutations/create-lead');
const updateUpfrontLead = require('./mutations/update-lead');

const resolvers = {
  Query: {

  },
  Mutation: {
    createUpfrontLead,
    updateUpfrontLead,
  },
};

module.exports = resolvers;
