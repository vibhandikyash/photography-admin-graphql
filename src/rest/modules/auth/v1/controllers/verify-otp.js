const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const CONFIG = require('../../../../../config/config');

const userLogger = require('../../../../../modules/user/user-logger');
const { models: { User: UserModel, AccessToken: AccessTokenModel } } = require('../../../../../sequelize-client');
const { verifyOtp } = require('../../../../../shared-lib/msg91');
const generateToken = require('../../../../../utils/auth/generate-token');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const getUserWithRelationship = require('../../../../../utils/get-user-with-relationship');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  BAD_REQUEST, OK, VALIDATION_FAILED, NOT_FOUND,
} = require('../../../../services/http-status-codes');
const { userFindOneByPhone } = require('../services');

const verifyUserOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }
    const { contactNo, otp } = req.body;
    const user = await userFindOneByPhone(contactNo);
    if (!user) {
      throw new ApiError('USER_NOT_FOUND', NOT_FOUND);
    }

    const verifyOtpResponse = await verifyOtp(`${user.countryCode}${contactNo}`, otp);
    if (!verifyOtpResponse) {
      await user.update({ otpWrongAttempts: (user.otpWrongAttempts + 1) }); // update otpWrongAttempts to +1
      throw new ApiError('INVALID_OTP', BAD_REQUEST);
    }

    // Reset the otp attributes
    await user.update({
      otp: null, otpExpiry: null, otpRequestAttempts: 0, otpWrongAttempts: 0,
    });

    const token = await generateToken(user.id); // Generating token

    const accessTokenObj = {
      token,
      tokenExpiry: moment().add(CONFIG.JWT.LIFE_TIME, 'minutes'),
      userId: user.id,
    };
    await AccessTokenModel.create(accessTokenObj);

    let refreshToken;
    if (user.refreshToken) {
      refreshToken = user.refreshToken;
    } else {
      refreshToken = jwt.sign({ userId: user.id }, CONFIG.JWT.SECRET);
      await UserModel.update({ refreshToken }, { where: { id: user.id } });
    }

    const profile = await getUserWithRelationship(user);

    // check if the user is completing onboarding or not by checking user's req feild
    const key = profile.role === 'FREELANCER' ? profile.userName : profile.business?.companyName;
    const isOnboard = !!key;

    const response = {
      id: profile.id ?? '',
      token,
      refreshToken,
      fullName: profile.fullName ?? '',
      role: profile.role ?? '',
      isOnboard,
    };

    return sendSuccessResponse(res, 'OTP_VERIFY_SUCCESS', OK, response);
  } catch (error) {
    userLogger(`Error while verifyOtp: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = verifyUserOtp;
