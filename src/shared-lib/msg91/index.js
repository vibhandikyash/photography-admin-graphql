const { default: axios } = require('axios');

const {
  MSG91,
  OTP: {
    TEST_NUMBERS = [], TEST_VALUE, EXPIRY, TEST_MODE,
  },
} = require('../../config/config');
const { VERIFY_OTP_RESPONSE: { SUCCESS } } = require('../../constants/service-constants');
const { logger } = require('../../logger');

/**
 *  Send Otp message
 * @param integer|string mobileNumber
 * @param integer|string otp
 * @returns boolean
 */
const sendOtp = async mobileNumber => {
  try {
    // if test mode true then restrict to send otp
    if (TEST_MODE && TEST_NUMBERS.includes(mobileNumber)) {
      return true;
    }

    const msg91Url = `${MSG91.URL}?template_id=${MSG91.TEMPLATE_ID}&mobile=${mobileNumber}&authkey=${MSG91.AUTH_KEY}&otp_expiry=${EXPIRY}`;

    const { data: { type } } = await axios.get(msg91Url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return type === SUCCESS;
  } catch (error) {
    logger.error(`Error while send msg91 OTP: ${error}`);
    return false;
  }
};

/**
 * Verify OTP upon mobileNumber
 * @param integer|string mobileNumber
 * @param integer|string otp
 * @returns boolean
 */
const verifyOtp = async (mobileNumber, otp) => {
  try {
    // if test mode true then no need to verify

    if (TEST_MODE && TEST_NUMBERS.includes(mobileNumber) && TEST_VALUE === otp) {
      return true;
    }

    const msg91VerifyUrl = `${MSG91.URL}/verify?otp=${otp}&authkey=${MSG91.AUTH_KEY}&mobile=${mobileNumber}`;

    const { data: { type } } = await axios.get(msg91VerifyUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return type === SUCCESS;
  } catch (error) {
    logger.error(`Error while verify msg91 OTP : ${error}}`);
    return false;
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
