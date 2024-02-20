const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../../../config/config');
const { DEFAULT_COUNTRY_CODE } = require('../../../../../constants/service-constants');
const defaultLogger = require('../../../../../logger');
const {
  models: { Country: CountryModel, State: StateModel, City: CityModel },
  Sequelize: { Op },
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');

const searchCountries = async (req, res, next) => {
  try {
    const { searchCity, searchState = '', stateId = null } = req.body;
    let { query: { limit = QUERY_PAGING_MIN_COUNT } } = req;
    const { query: { skip: offset = 0 } } = req;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);
    let { countryCode } = req.body; // Default country code set to india

    countryCode = countryCode?.toUpperCase(); // convert to uppercase
    if (!countryCode) {
      countryCode = DEFAULT_COUNTRY_CODE;
    }

    let response;

    const where = { countryCode };
    if (searchCity || stateId || searchCity === '') {
      if (searchCity) {
        where.name = { [Op.iLike]: `${searchCity}%` };
      }

      if (stateId) {
        where.stateId = stateId;
      }

      response = await CityModel.findAll({
        where,
        attributes: ['id', 'name'],
        include: [{ model: StateModel, as: 'state', attributes: ['id', 'name'] }],
        limit,
        offset,
      });
    } else if (countryCode || searchState) {
      where.name = { [Op.iLike]: `${searchState}%` };
      response = await StateModel.findAll({
        where, attributes: ['id', 'name', 'countryCode'], limit, offset,
      });
    } else {
      response = await CountryModel.findAll({ attributes: ['id', 'name', 'phoneCode', ['iso2', 'countryCode']] }, limit, offset);
    }

    return sendSuccessResponse(res, 'SUCCESS', 200, response);
  } catch (error) {
    defaultLogger(`Error while search-countries: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = searchCountries;
