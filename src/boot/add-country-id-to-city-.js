/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const defaultLogger = require('../logger');

const addCountryIdToCity = async models => {
  try {
    const { State: StateModel, City: CitiesModel } = models;

    const countryIdToCity = async () => {
      try {
        const getStatesData = await StateModel.findAll();
        for (const stateObj of getStatesData) {
          await CitiesModel.update({
            countryId: stateObj.countryId,
          }, {
            where: {
              countryId: null,
              stateId: stateObj.id,
            },
          });
        }
        console.log('addCountryIdToCity executed');
      } catch (error) {
        defaultLogger(`Error while update county id to cities > ${error}`, null, 'error');
        throw error;
      }
    };
    setTimeout(async () => {
      await countryIdToCity();
    }, 50000);
  } catch (error) {
    defaultLogger(`Error while updating country id to cities ${error}`, null, 'error');
  }
};

module.exports = addCountryIdToCity;
