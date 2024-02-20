const listCities = require('./queries/list-cities');
const listCountries = require('./queries/list-countries');
const listStates = require('./queries/list-states');

const resolvers = {
  Query: {
    listCountries,
    listStates,
    listCities,
  },
};

module.exports = resolvers;
