const { PASSWORD_REGEX } = require('../../../constants/regex-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { generatePassword } = require('../../../utils/auth/generate-password');
const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const setUserPassword = async (_, args, ctx) => {
  try {
    const { data } = args;
    const { password, uId, token } = data;
    const { models: { User: UserModel }, localeService } = ctx;

    if (!password) {
      return new CustomApolloError(getMessage('PASSWORD_REQUIRED', localeService));
    }
    if (!uId || !token) throw new CustomApolloError(getMessage('MISSING_REQUIRED_DATA', localeService));

    if (!PASSWORD_REGEX.test(password)) {
      throw new CustomApolloError(getMessage('STRONG_PASSWORD_REQUIRED', localeService));
    }

    const userInstance = await UserModel.findByPk(uId);
    if (!userInstance || userInstance.accountDeletedAt !== null) {
      return new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }

    if (!userInstance.resetToken || userInstance.resetToken !== token) {
      return new CustomApolloError(getMessage('INVALID_TOKEN'));
    }
    const hashedPwd = await generatePassword(password);
    await UserModel.update({ password: hashedPwd, resetToken: null, emailVerified: true }, { where: { id: uId } });

    const response = {
      status: 'SUCCESS',
      message: getMessage('PASSWORD_SET_SUCCESS', localeService),
    };
    return response;
  } catch (error) {
    userLogger(`Error while set user password : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = setUserPassword;
