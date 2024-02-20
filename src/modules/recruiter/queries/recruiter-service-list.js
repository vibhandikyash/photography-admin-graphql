const { Op } = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const {
  BOOKING_FEES, ADDITIONAL_BOOKING_FEES, CANCELLATION_CHARGES, REFUND, WAIVE_OFF, CONFIGURATION_KEYS: { CONVENIENCE_FEES },
} = require('../../../constants/service-constants');
const recruiterLogger = require('../recruiter-logger');

const recruiterServiceList = async (_, args, ctx) => {
  try {
    const {
      req: { user: { id: userId } = {} },
      models: { Transaction: TransactionModel, Event: EventModel, City: CityModel },
    } = ctx;

    const {
      where: {
        amount: { min: minAmount = 0, max: maxAmount = 0 } = {}, date: { from = null, to = null } = {},
        transactionType = [BOOKING_FEES, ADDITIONAL_BOOKING_FEES, CANCELLATION_CHARGES, REFUND, WAIVE_OFF, CONVENIENCE_FEES],
      } = {},
      filter: { skip: offset = 0, search = '' } = {},
    } = args;

    const condition = { userId, transactionType: { [Op.in]: transactionType } };

    if (minAmount && maxAmount) { condition.amount = { [Op.between]: [minAmount, maxAmount] }; }

    if (from && to) { condition.createdAt = { [Op.between]: [from, to] }; }

    let { filter: { limit = QUERY_PAGING_MIN_COUNT } = {} } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);
    const count = await TransactionModel.count({
      where: condition,
      include: { model: EventModel, as: 'event', where: { name: { [Op.iLike]: `%${search}%` } } },
    });

    const services = await TransactionModel.findAll({
      where: condition,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'transactionType', 'amount', 'createdAt'],
      include: [
        {
          model: EventModel,
          as: 'event',
          attributes: ['id', 'name', 'startDate'],
          where: { name: { [Op.iLike]: `%${search}%` } },
          include: { model: CityModel, as: 'cities', attributes: ['name'] },
        },
      ],
    });

    const response = { count, data: services };

    return response;
  } catch (error) {
    recruiterLogger(`Error from recruiterServiceList: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = recruiterServiceList;
