const { get, isNaN } = require('lodash');

const { RECRUITER } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const transactionLogger = require('../transaction-logger');

const getRecruiterAvailableBalance = async (_, args, ctx) => {
  try {
    const { recruiterId } = args;
    const {
      User: UserModel,
      UserBusiness: UserBusinessModel,
    } = ctx.models;
    const { localeService } = ctx;

    const getRecruiterInstance = await UserModel.findByPk(recruiterId, {
      include: [
        {
          model: UserBusinessModel,
          as: 'business',
          attributes: ['userId', 'totalBalance'],
        },
      ],
      attributes: ['id', 'role', 'accountDeletedAt'],
    });

    if (!getRecruiterInstance || getRecruiterInstance.role !== RECRUITER || getRecruiterInstance.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('RECRUITER_NOT_FOUND', localeService));
    }
    let totalBalance = get(getRecruiterInstance, 'business.totalBalance', 0);
    totalBalance = isNaN(totalBalance) ? 0 : totalBalance;

    const response = {
      totalBalance,
    };

    return response;
  } catch (error) {
    transactionLogger(`Error while get recruiter available balance : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterAvailableBalance;
