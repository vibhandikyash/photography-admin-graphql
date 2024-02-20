const crypto = require('crypto');

const { SALT } = require('../../../config/config');

const { PASSWORD_REGEX } = require('../../../constants/regex-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { generatePassword } = require('../../../utils/auth/generate-password');
const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const changePassword = async (_, args, ctx) => {
  try {
    const { localeService } = ctx;
    const { data } = args;
    const { oldPassword, newPassword } = data;
    const {
      req: { user },
      models: { User: UserModel },
    } = ctx;

    if (oldPassword === newPassword) {
      throw new CustomApolloError(getMessage('PASSWORD_NOT_ALLOWED', localeService));
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      throw new CustomApolloError(getMessage('STRONG_PASSWORD_REQUIRED', localeService));
    }

    const isValidPassword = crypto.pbkdf2Sync(oldPassword, SALT, 1000, 64, 'sha512').toString('hex') === user.password;

    if (!isValidPassword) {
      throw new CustomApolloError(getMessage('PASSWORD_INCORRECT', localeService));
    }

    const hashPassword = await generatePassword(newPassword);
    await UserModel.update({ password: hashPassword, refreshToken: null }, { where: { id: user.id } });

    // terminate all session of this user
    // await AccessTokenModel.destroy({ where: { userId: user.id } });

    return { status: 'SUCCESS', message: getMessage('CHANGE_PASSWORD_SUCCESS', localeService) };
  } catch (error) {
    userLogger(`Error while change password : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = changePassword;
