/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const CONFIG = require('../../../../../config/config');
const defaultLogger = require('../../../../../logger');
const { models: { City: CityModel } } = require('../../../../../sequelize-client');
const { generateS3PublicUrl } = require('../../../../../shared-lib/aws/functions/generate-get-signed-url');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');

const getTopCities = async (req, res, next) => {
  try {
    const { limit = 5, skip = 0 } = req.query;
    const cities = await CityModel.findAll({
      limit,
      offset: skip,
      where: { isFeatured: true },
      attributes: ['id', 'name', ['asset_url', 'url']], // rename the attribute 'asset_url' to 'url'
      order: [
        ['order', 'ASC'],
      ],
    });

    const response = JSON.parse(JSON.stringify(cities));
    for (const city of response) {
      const url = await generateS3PublicUrl(city.url, CONFIG.AWS.BUCKET.PUBLIC_BUCKET_NAME);
      city.url = url ?? '';
    }

    return sendSuccessResponse(res, 'SUCCESS', OK, response);
  } catch (error) {
    defaultLogger(`Error in get-top-cities: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getTopCities;
