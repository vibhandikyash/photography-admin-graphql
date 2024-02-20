const { Op } = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { MODE_OF_PAYMENT } = require('../../../constants/service-constants');
const transactionLogger = require('../transaction-logger');

const getTopUpTransactionList = async (_, args, ctx) => {
  try {
    const { models: { TopUpRequest: TopUpRequestModel, User: UserModel } } = ctx;
    const { filter = {}, where = {} } = args;

    const {
      skip: offset = 0, sortOn = 'createdAt', sortBy = 'DESC', search = '',
    } = filter;
    const { status, createdAt: { before, after } = {} } = where;
    let { limit = QUERY_PAGING_MIN_COUNT } = filter;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const whereCondition = {
      modeOfPayment: MODE_OF_PAYMENT.CASH,
      [Op.or]: [
        { '$sender.full_name$': { [Op.iLike]: `%${search}%` } },
        { '$receiver.full_name$': { [Op.iLike]: `%${search}%` } },
        { '$receiver.contact_no$': { [Op.iLike]: `%${search}%` } },
      ],
    };

    if (status) { whereCondition.status = { [Op.in]: status }; }
    if (before && after) { whereCondition.createdAt = { [Op.gte]: after, [Op.lte]: before }; }

    const count = await TopUpRequestModel.count({
      where: { ...whereCondition },
      include: [
        {
          model: UserModel,
          as: 'sender',
        },
        {
          model: UserModel,
          as: 'receiver',
        },
      ],
    });

    const data = await TopUpRequestModel.findAll({
      attributes: ['amount', 'status', 'createdAt', 'seriesNo'],
      include: [
        {
          model: UserModel,
          as: 'sender',
          attributes: ['fullName'],
        },
        {
          model: UserModel,
          as: 'receiver',
          attributes: ['fullName', 'contactNo', 'countryCode'],
        },
      ],
      where: { ...whereCondition },
      offset,
      limit,
      order: [
        [sortOn, sortBy],
      ],
    });

    const result = {
      count: parseInt(count, 10),
      data,
    };

    return result;
  } catch (error) {
    transactionLogger(`Error while get top up transaction list : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getTopUpTransactionList;
