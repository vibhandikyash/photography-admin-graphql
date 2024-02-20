const jwt = require('jsonwebtoken');
const moment = require('moment');

const CONFIG = require('../../../config/config');
const { FREELANCER } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { verifyOtp } = require('../../../shared-lib/msg91');
const generateToken = require('../../../utils/auth/generate-token');
const getUserWithRelationship = require('../../../utils/get-user-with-relationship');
const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const verifyWebLoginOtp = async (_, args, ctx) => {
  try {
    const { JWT: { LIFE_TIME, SECRET } } = CONFIG;
    const { data: { contactNo, countryCode, otp } } = args;
    const { models: { User: UserModel, AccessToken: AccessTokenModel, UserProfile: UserProfileModel }, localeService } = ctx;

    const user = await UserModel.findOne({
      where: { contactNo, countryCode, accountDeletedAt: null },
      include: { model: UserProfileModel, as: 'profile' },
    });
    if (!user) {
      throw new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }

    const verifyOtpResponse = await verifyOtp(`${countryCode}${contactNo}`, otp);
    if (!verifyOtpResponse) {
      await user.update({ otpWrongAttempts: (user.otpWrongAttempts + 1) }); // update otpWrongAttempts to +1
      throw new CustomApolloError(getMessage('INVALID_OTP', localeService));
    }

    // Reset the otp attributes
    await user.update({
      otp: null, otpExpiry: null, otpRequestAttempts: 0, otpWrongAttempts: 0,
    });

    const { id: userId } = user;
    let { refreshToken } = user;

    const token = await generateToken(userId); // Generating token

    const accessTokenObj = {
      token,
      tokenExpiry: moment().add(LIFE_TIME, 'minutes'),
      userId,
    };
    await AccessTokenModel.create(accessTokenObj);

    if (!refreshToken) {
      refreshToken = jwt.sign({ userId: user.id }, SECRET);
      await UserModel.update({ refreshToken }, { where: { id: user.id } });
    }
    const profile = await getUserWithRelationship(user);
    const key = profile.role === FREELANCER ? profile.userName : profile.business?.companyName;
    const isOnboard = !!key;

    const response = { token, refreshToken, isOnboard };
    return response;
  } catch (error) {
    userLogger(`Error while verifyOtp : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = verifyWebLoginOtp;
