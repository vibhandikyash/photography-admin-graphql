/* eslint-disable no-shadow */
const { CustomApolloError } = require('../../../shared-lib/error-handler/custom-apollo-error');

const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const user = async (_, args, ctx) => {
  try {
    const { models, localeService } = ctx;
    const { User: UserModel } = models;
    const { where: { id } } = args;

    const userInstance = await UserModel.findOne({
      where: {
        id,
        accountDeletedAt: null,
      },
      attributes: { exclude: ['refreshToken', 'otp', 'otpExpiry', 'otpRequestAttempts', 'otpWrongAttempts'] },
    });

    if (!userInstance) {
      throw new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }

    return userInstance;
  } catch (error) {
    userLogger(`Error from  user : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = user;
