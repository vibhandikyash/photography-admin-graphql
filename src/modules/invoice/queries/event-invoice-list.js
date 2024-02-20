const { Op } = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { INVOICE_TYPES } = require('../../../constants/service-constants');
const invoiceLogger = require('../invoice-logger');

const eventInvoiceList = async (_, args, ctx) => {
  try {
    const { models: { Invoice: InvoiceModel, User: UserModel } } = ctx;

    const {
      where: { eventId, type = INVOICE_TYPES },
      filter: {
        skip: offset = 0, search = '',
      } = {},
    } = args;

    let { filter: { limit = QUERY_PAGING_MIN_COUNT } = {} } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const count = await InvoiceModel.count({
      where: { eventId, type: { [Op.in]: type } },
      include: {
        model: UserModel,
        as: 'user',
        where: { fullName: { [Op.iLike]: `%${search}%` } },
      },
    });

    const invoices = await InvoiceModel.findAll({
      where: { eventId, type: { [Op.in]: type } },
      attributes: ['seriesNo', 'type', 'key'],
      include: {
        model: UserModel,
        as: 'user',
        attributes: ['fullName'],
        where: { fullName: { [Op.iLike]: `%${search}%` } },
      },
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    const result = { count, data: invoices };
    return result;
  } catch (error) {
    invoiceLogger(`Error from eventInvoiceList : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = eventInvoiceList;
