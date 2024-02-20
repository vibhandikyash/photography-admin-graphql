/* eslint-disable no-restricted-syntax */
const { map, filter } = require('lodash');

const defaultLogger = require('../../logger');

const { getCachedData, setCacheData } = require('../../redis-client');
const { models } = require('../../sequelize-client');

const getConfigurations = async () => {
  try {
    const { Configuration: ConfigurationModel } = models;
    const configKey = 'APP_CONFIG';
    let configValue = await getCachedData(configKey);
    if (!configValue) {
      configValue = await ConfigurationModel.findAll({
        attributes: ['key', 'value'],
        raw: true,
      });
      setCacheData(configKey, configValue);
      return configValue;
    }
    return configValue;
  } catch (error) {
    defaultLogger(`Error From getConfigurations ${error}`, null, 'error');
    throw error;
  }
};

const getConfigByKey = async keys => {
  try {
    const configurations = await getConfigurations();
    const configValues = [];
    for (const key of keys) {
      const [configurationValue] = map(filter(configurations, { key }), 'value');
      configValues.push(configurationValue);
    }
    return configValues;
  } catch (error) {
    defaultLogger(`Error From getConfigByKey ${error}`, null, 'error');
    throw error;
  }
};

module.exports = { getConfigByKey, getConfigurations };
