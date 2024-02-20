// const addCountryIdToCity = require('./add-country-id-to-city-');
// const combineCityStateCountry = require('./country-data/combine');
// const createCountriesCityState = require('./create-countries-city-state');
const createConfigurations = require('./create-configuration');
const createFreelancerCategory = require('./create-freelancer-category');
const createModule = require('./create-module');
const createRole = require('./create-role');
const createRoleModule = require('./create-role-module');
const createUserBadge = require('./create-user-badge');
const createUserType = require('./create-user-type');

const createUsers = require('./create-users');
// eslint-disable-next-line no-unused-vars
const bootFiles = async models => {
  // await combineCityStateCountry();
  await createUsers(models);
  await createUserType(models);
  await createFreelancerCategory(models);
  await createUserBadge(models);
  await createModule(models);
  await createRole(models);
  await createConfigurations(models);
  await createRoleModule(models);
  // await createCountry(models);
  // await createState(models);
  // await createCountriesCityState(models);
  // await addCountryIdToCity(models);
};

module.exports = bootFiles;
