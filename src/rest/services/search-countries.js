const defaultLogger = require('../../logger');
const {
  models:
  { Country: CountryModel, State: StateModel, City: CityModel }, Sequelize,
} = require('../../sequelize-client');
const { sendSuccessResponse } = require('../../utils/create-error');

const searchCountries = async (req, res, next) => {
  try {
    const { searchCity } = req.body;
    const { limit = 30 } = req.query; // Default limit is 30
    let { countryCode } = req.body; // Default country code set to india
    countryCode = countryCode?.toUpperCase(); // convert to uppercase

    let response;

    if (searchCity || searchCity === '') {
      if (!countryCode) countryCode = 'IN';
      const { Op } = Sequelize;
      response = await CityModel.findAll({
        where: { name: { [Op.iLike]: `${searchCity}%` }, countryCode },
        attributes: ['id', 'name'],
        limit,
      });
    } else if (countryCode) {
      response = await StateModel.findAll({
        where: { countryCode },
        attributes: ['id', 'name', 'countryCode'],
        limit,
      });
    } else {
      response = await CountryModel.findAll({ attributes: ['id', 'name', 'phoneCode', ['iso2', 'countryCode']] }, limit);
    }

    return sendSuccessResponse(res, 'SUCCESS', 200, response);
  } catch (error) {
    defaultLogger(`Error while search-countries: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = searchCountries;
