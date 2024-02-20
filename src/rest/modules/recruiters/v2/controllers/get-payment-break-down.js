const { SUCCESS } = require('../../../../../constants/service-constants');

const {
  UserBusiness: UserBusinessModel,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { OK } = require('../../../../services/http-status-codes');
const eventLogger = require('../../../events/event-logger');
const getPaymentsAmount = require('../services/get-payments-amount');
const getServicesAmount = require('../services/get-services-amount');

const getPaymentBreakDown = async (req, res, next) => {
  try {
    const { user: { id: userId } } = req;

    const { totalBalance } = await UserBusinessModel.findOne({ where: { userId }, attributes: ['totalBalance'] });
    const totalServices = await getServicesAmount(userId) || 0;
    const totalPayments = await getPaymentsAmount(userId) || 0;

    return sendSuccessResponse(res, SUCCESS, OK, { totalServices, totalPayments, totalBalance });
  } catch (error) {
    eventLogger(`Error from get-payment-break-down: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getPaymentBreakDown;
