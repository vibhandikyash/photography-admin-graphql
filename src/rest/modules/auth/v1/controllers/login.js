const { validationResult } = require('express-validator');

const { allowedRoles } = require('../../../../../constants/constants');

const defaultLogger = require('../../../../../logger');
const { sendOtp } = require('../../../../../shared-lib/msg91');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  FORBIDDEN, VALIDATION_FAILED, OK, NOT_FOUND, BAD_REQUEST,
} = require('../../../../services/http-status-codes');
const { userFindOneByPhone } = require('../services');

const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }
    const { contactNo } = req.body;

    const user = await userFindOneByPhone(contactNo);

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', NOT_FOUND);
    }

    // User activation is required
    if (!user.isActive) {
      throw new ApiError('USER_NOT_ACTIVE', FORBIDDEN);
    }

    // Check only freelancers & recruiters are allowed to login
    if (!allowedRoles.includes(user.role)) throw new ApiError('FORBIDDEN', FORBIDDEN);

    // Send OTP
    const sendOtpResponse = await sendOtp(`${user.countryCode}${contactNo}`);
    if (!sendOtpResponse) {
      throw new ApiError(getMessage('OTP_SENT_ERROR'), BAD_REQUEST);
    }

    return sendSuccessResponse(res, 'OTP_SEND_SUCCESS', OK);
  } catch (error) {
    defaultLogger(`Error while logging in user: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = loginUser;
