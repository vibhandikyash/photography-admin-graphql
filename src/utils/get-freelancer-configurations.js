/* eslint-disable no-restricted-syntax */
const { map, filter } = require('lodash');

const { logger } = require('../logger');

const getFreelancerConfiguration = async (configurations, keys) => {
  try {
    const configValues = [];
    for (const key of keys) {
      const [configurationValue] = map(filter(configurations, { key }), 'value');
      configValues.push(configurationValue);
    }
    return configValues;
  } catch (error) {
    logger.error(`Error From getFreelancerConfiguration ${error}`);
    throw error;
  }
};

module.exports = getFreelancerConfiguration;
