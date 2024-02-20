const { get } = require('lodash');

const { EVENT_FEES, COMPLETED } = require('../../../../../constants/service-constants');
const { User: UserModel, Transaction: TransactionModel } = require('../../../../../sequelize-client');

const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const freelancersLogger = require('../../freelancers-logger');

const getTransactionDetails = async (req, res, next) => {
  try {
    const { user } = req;
    const userTransactionInstance = await UserModel.findByPk(user.id, {
      attributes: ['id', 'fullName', 'accountDeletedAt'],
      include: [
        {
          model: TransactionModel,
          as: 'transactions',
          required: false,
          where: {
            transactionType: EVENT_FEES,
            transactionStatus: COMPLETED,
          },
        },
      ],
    });

    if (!userTransactionInstance || userTransactionInstance.accountDeletedAt !== null) {
      throw new ApiError('USER_NOT_FOUND', 404);
    }

    const transactionInstance = get(userTransactionInstance, 'transactions');
    const totalBalance = transactionInstance.length > 0 ? transactionInstance.reduce((initialObj2, obj) => initialObj2 + obj.amount, 0) : 0;
    const response = {
      fullName: get(userTransactionInstance, 'fullName'),
      projectsComplete: transactionInstance.length || 0,
      totalBalance,
    };

    return sendSuccessResponse(res, 'SUCCESS', 200, response);
  } catch (error) {
    freelancersLogger(`Error from freelancer-get-dashboard-transaction-details: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getTransactionDetails;
