const eventLogger = require('../event-logger');

const eventCityFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { City: CityModel } } = ctx;
    const { location: cityId, cities } = parent;

    if (cities) {
      return cities;
    }

    if (!cityId) {
      return null;
    }

    const city = await CityModel.findByPk(cityId, { attributes: ['id', 'name'] });
    return city;
  } catch (err) {
    eventLogger(`Error in eventCityFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventCityFieldResolver;
