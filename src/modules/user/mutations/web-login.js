const { allowedRoles } = require('../../../constants/constants');
const { SUCCESS } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { sendOtp } = require('../../../shared-lib/msg91');
const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const webLogin = async (_, args, ctx) => {
  try {
    const { data: { contactNo, countryCode } } = args;
    const { models: { User: UserModel }, localeService } = ctx;

    const user = await UserModel.findOne({ where: { contactNo, countryCode, accountDeletedAt: null } });

    if (!user) {
      throw new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }

    // User activation is required
    if (!user.isActive) {
      throw new CustomApolloError(getMessage('USER_NOT_ACTIVE', localeService));
    }

    // Check only freelancers & recruiters are allowed to login
    if (!allowedRoles.includes(user.role)) {
      throw new CustomApolloError(getMessage('FORBIDDEN', localeService));
    }

    const sendOtpResponse = await sendOtp(`${countryCode}${contactNo}`);
    if (!sendOtpResponse) {
      throw new CustomApolloError(getMessage('OTP_SENT_ERROR', localeService));
    }

    // Increase Otp request attempts
    await UserModel.increment('otpRequestAttempts', { by: 1, where: { id: user.id } });

    const response = { status: SUCCESS, message: getMessage('OTP_SEND_SUCCESS', localeService) };
    return response;
  } catch (error) {
    userLogger(`Error while webLogin : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = webLogin;
