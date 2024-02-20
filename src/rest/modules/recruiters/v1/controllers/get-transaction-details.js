/* eslint-disable no-restricted-syntax */
const { get } = require('lodash');

const { COMPLETED } = require('../../../../../constants/service-constants');

const {
  User: UserModel,
  Event: EventModel,
  UserBusiness: UserBusinessModel,
  Transaction: TransactionModel,
} = require('../../../../../sequelize-client');

const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const recruitersLogger = require('../../recruiters-logger');

const CREDIT = ['TOP_UP', 'INITIAL_FEES', 'REFUND', 'WAIVE_OFF'];
const SPENT = ['BOOKING_FEES', 'CONVENIENCE_FEES', 'CANCELLATION_CHARGES', 'EVENT_FEES'];

const getTransactionDetails = async (req, res, next) => {
  try {
    const { user } = req;
    const userProjectsData = await UserModel.findByPk(user.id, {
      attributes: ['id', 'fullName'],
      include: [
        {
          model: EventModel,
          as: 'recruiterEvent',
          attributes: ['name'],
          where: { status: COMPLETED },
          required: false,
        },
        {
          model: UserBusinessModel,
          as: 'business',
          attributes: ['totalBalance'],
        },
      ],
    });

    const totalSpentData = await TransactionModel.findAll({
      where: { userId: user.id, transactionType: SPENT },
    });

    const totalCreditData = await TransactionModel.findAll({
      where: { userId: user.id, transactionType: CREDIT },
    });
    if (!userProjectsData) {
      throw new ApiError('USER_NOT_FOUND', 404);
    }

    let totalSpent = 0;
    let totalCredit = 0;

    for (const transaction of totalSpentData) {
      const { amount } = transaction;
      totalSpent += amount;
    }

    for (const transaction of totalCreditData) {
      const { amount } = transaction;
      totalCredit += amount;
    }

    const response = {
      fullName: get(userProjectsData, 'fullName'),
      projectsComplete: get(userProjectsData, 'recruiterEvent.length', 0),
      totalBalance: get(userProjectsData, 'business.totalBalance', 0),
      totalCredit,
      totalSpent,
    };

    return sendSuccessResponse(res, 'SUCCESS', 200, response);
  } catch (error) {
    recruitersLogger(`Error from recruiter-get-transaction-details: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getTransactionDetails;
