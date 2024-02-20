/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const defaultLogger = require('../logger');

const configurationObjs = require('./data/configuration');

const createConfigurations = async models => {
  try {
    const { Configuration: ConfigurationModel } = models;

    const configurations = async () => {
      try {
        const configurationData = [];
        for (const configuration of configurationObjs) {
          const count = await ConfigurationModel.count({
            where: { key: configuration.key },
          });
          if (!count) {
            configurationData.push(configuration);
          }
        }
        if (configurationData.length) {
          await ConfigurationModel.bulkCreate(configurationData);
        }
      } catch (error) {
        defaultLogger(`Error while bulk create configuration > ${error}`, null, 'error');
        throw error;
      }
    };

    setTimeout(async () => {
      await configurations();
    }, 10000);
  } catch (error) {
    defaultLogger(`Error while creating configurations ${error}`, null, 'error');
  }
};

module.exports = createConfigurations;
