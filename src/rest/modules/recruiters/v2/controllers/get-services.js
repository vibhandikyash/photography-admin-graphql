const { Op } = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../../../config/config');
const {
  SUCCESS, BOOKING_FEES, ADDITIONAL_BOOKING_FEES, CANCELLATION_CHARGES, REFUND, WAIVE_OFF, CONFIGURATION_KEYS,
} = require('../../../../../constants/service-constants');
const {
  Event: EventModel,
  Transaction: TransactionModel,
  City: CityModel,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');
const eventLogger = require('../../../events/event-logger');

const getServices = async (req, res, next) => {
  try {
    let { query: { limit = QUERY_PAGING_MIN_COUNT } } = req;
    const {
      query: { skip: offset = 0 },
      user: { id: userId },
    } = req;

    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const servicesTypes = [BOOKING_FEES, ADDITIONAL_BOOKING_FEES, CANCELLATION_CHARGES, REFUND,
      WAIVE_OFF, CONFIGURATION_KEYS.CONVENIENCE_FEES];

    const count = await TransactionModel.count({
      where: { userId, transactionType: { [Op.in]: servicesTypes } },
    });

    const services = await TransactionModel.findAll({
      where: { userId, transactionType: { [Op.in]: servicesTypes } },
      limit,
      offset,
      order: [
        ['createdAt', 'DESC'],
      ],
      attributes: ['id', 'eventId', 'transactionType', 'amount', 'createdAt'],
      include: [
        {
          model: EventModel,
          as: 'event',
          attributes: ['name', 'startDate', 'endDate'],
          include: [
            {
              model: CityModel,
              as: 'cities',
              attributes: ['id', 'name', 'stateCode', 'countryCode'],
            },
          ],
        },
      ],
    });

    return sendSuccessResponse(res, SUCCESS, OK, { count, services });
  } catch (error) {
    eventLogger(`Error from get-services: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getServices;
