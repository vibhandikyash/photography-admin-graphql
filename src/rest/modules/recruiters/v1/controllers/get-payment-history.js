const { get } = require('lodash');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../../../config/config');
const {
  models:
  {
    Transaction: TransactionModel,
    Event: EventModel,
    City: CityModel,
    UserBusiness: UserBusinessModel,
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

    const totalBalanceData = await UserBusinessModel.findOne({ where: { userId: user.id }, attributes: ['totalBalance'] });

    const eventInstances = await TransactionModel.findAll({
      where: { userId: user.id },
      limit,
      offset,
      order: [
        ['createdAt', 'DESC'],
      ],
      attributes: ['id', 'eventId', 'transactionType', 'amount'],
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
      totalBalance: get(totalBalanceData, 'totalBalance'),
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
