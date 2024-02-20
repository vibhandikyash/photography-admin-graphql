const { isEmpty } = require('lodash');

const eventLogger = require('../event-logger');

const eventStateFieldResolver = async (parent = {}, args, ctx = {}) => {
  try {
    const { models: { City: CityModel, State: StateModel } } = ctx;
    const { location: cityId, cities } = parent;

    if (cities) {
      return cities;
    }

    if (!cityId) {
      return null;
    }

    const city = await CityModel.findByPk(cityId, {
      attributes: ['id'],
      include: {
        model: StateModel,
        as: 'state',
        attributes: ['id', 'name'],
      },
    });
    if (isEmpty(city.state)) {
      return null;
    }
    const { state } = city;
    return state;
  } catch (err) {
    eventLogger(`Error in eventStateFieldResolver: ${err}`, ctx);
    throw err;
  }
};

module.exports = eventStateFieldResolver;
