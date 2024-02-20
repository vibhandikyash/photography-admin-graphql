const moment = require('moment');

const CONFIG = require('../../../../../config/config');
const defaultLogger = require('../../../../../logger');
const { sendOtp } = require('../../../../../shared-lib/msg91/index');
const { ApiError } = require('../../../../services/custom-api-error');

/*eslint-disable */
/**
 * Returns the random number or character for the given length
 * @param {*} len
 * @param {string} chars
 * @returns
 */
const getRandomPin = (len, chars = '0123456789') => [...Array(len)].map(
  i => chars[Math.floor(Math.random() * chars.length)],
).join('');
/* eslint-enable */
const sendOtpForVerification = async user => {
  try {
    const otp = Number(CONFIG.OTP.TEST_MODE === true
      ? getRandomPin(Number(CONFIG.OTP.LENGTH), '1') : getRandomPin(Number(CONFIG.OTP.LENGTH))); // Otp will be 1 except for the production environment
    const otpExpiry = moment().add(CONFIG.OTP.EXPIRY, 'seconds'); // Generating future date for otp expiry
    const combineMobileNumberAndCountryCode = `${user.countryCode}${user.contactNo}`;

    if (!CONFIG.OTP.TEST_MODE) {
      const otpStatus = await sendOtp(combineMobileNumberAndCountryCode, otp);
      if (!otpStatus) {
        throw new ApiError('OTP_SENT_ERROR', 422);
      }
    }
    await user.update({ otp, otpRequestAttempts: (user.otpRequestAttempts + 1), otpExpiry }); // TODO: Validate the otp attempts

    defaultLogger(`otp sent to -> ${user.contactNo} `, null, 'info');
  } catch (error) {
    defaultLogger(`Error while sending OTP  ${error.message}`, null, 'error');
  }
};

module.exports = sendOtpForVerification;
