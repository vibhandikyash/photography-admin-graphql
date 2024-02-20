/* eslint-disable no-use-before-define */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const path = require('path');

const { groupBy } = require('lodash');

const defaultLogger = require('../../logger');

const cities = require('./cities.json');
const countries = require('./countries.json');
const statesData = require('./states.json');

const combineCityStateCountry = () => {
  try {
    const data = [];
    const groupedStatesByCountry = groupBy(statesData, 'countryId');
    const groupedCitiesByState = groupBy(cities, 'stateId');
    for (const country of countries) {
      const statesAndCities = [];
      if (groupedStatesByCountry[country.id]) {
        for (const state of groupedStatesByCountry[country.id]) {
          delete country.id;
          delete state.countryId;
          const cityArray = [];
          if (groupedCitiesByState[state.id]) {
            for (const city of groupedCitiesByState[state.id]) {
              delete city.id;
              delete city.stateId;
              delete city.countryId;
              cityArray.push(city);
            }
            delete state.id;
            statesAndCities.push({
              ...state,
              cities: cityArray,
            });
          }
        }
        data.push(
          {
            ...country,
            state: statesAndCities,
          },
        );
      }
    }

    fs.writeFileSync(path.join(__dirname, 'combined.json'), JSON.stringify(data, null, 4));
  } catch (error) {
    defaultLogger(`Error while combine cityStateCountry data ${error}`, null, 'error');
  }
};
module.exports = combineCityStateCountry;
