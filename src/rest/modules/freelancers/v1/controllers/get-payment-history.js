const { Op } = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../../../config/config');
const { TOP_UP } = require('../../../../../constants/service-constants');
const {
  models:
  {
    Transaction: TransactionModel,
    Event: EventModel,
    City: CityModel,
  },
} = require('../../../../../sequelize-client');

const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const { ApiError } = require('../../../../services/custom-api-error');
const { BAD_REQUEST, OK } = require('../../../../services/http-status-codes');
const eventLogger = require('../../../events/event-logger');

const getPaymentHistory = async (req, res, next) => {
  try {
    const { user } = req;

    let { query: { limit = QUERY_PAGING_MIN_COUNT } } = req;
    const { skip: offset } = req.query;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const eventInstances = await TransactionModel.findAll({
      where: { [Op.or]: [{ userId: user.id }, { freelancerId: user.id, transactionType: TOP_UP }] },
      limit,
      offset,
      order: [
        ['createdAt', 'DESC'],
      ],
      attributes: ['id', 'transactionType', 'transactionStatus', 'amount'],
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

    const result = {
      count: eventInstances.length,
      transactions: eventInstances,
    };

    if (!result) {
      throw new ApiError(getMessage('NO_TRANSACTION_FOUND'), BAD_REQUEST);
    }

    return sendSuccessResponse(res, 'SUCCESS', OK, result);
  } catch (error) {
    eventLogger(`Error in getting-payment-history: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getPaymentHistory;
