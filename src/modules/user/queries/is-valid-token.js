const moment = require('moment');

const { CustomApolloError } = require('../../../shared-lib/error-handler');

const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const isValidToken = async (_, args, ctx) => {
  try {
    const { data } = args;
    const { token, uId } = data;
    const { models: { User: UserModel }, localeService } = ctx;

    if (!uId || !token) throw new CustomApolloError(getMessage('MISSING_REQUIRED_PARAMETER', localeService));

    const userInstance = await UserModel.findOne({ where: { id: uId, resetToken: token, accountDeletedAt: null } });
    if (!userInstance) {
      return new CustomApolloError(getMessage('INVALID_RESET_TOKEN', localeService));
    }

    if (moment().isAfter(moment(userInstance.resetTokenExpiry))) {
      return new CustomApolloError(getMessage('PASSWORD_RESET_LINK_EXPIRED', localeService));
    }

    const response = {
      status: 'SUCCESS',
      message: getMessage('TOKEN_VALIDATION_SUCCESS', localeService),
    };
    return response;
  } catch (error) {
    userLogger(`Error while is valid token: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = isValidToken;
