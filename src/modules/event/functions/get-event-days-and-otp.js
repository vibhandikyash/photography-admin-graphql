/* eslint-disable no-restricted-syntax */
const moment = require('moment');

const {
  CONFIGURATION_KEYS: { REGULARIZE_REQUEST_PRICE_MULTIPLIER }, REGULARIZE_REQUEST_VALIDATION_HOURS, REGULARIZE_REQUEST_VALIDATION_END_TIME,
} = require('../../../constants/service-constants');
const { getConfigByKey } = require('../../../shared-lib/configurations');
const generateRandomNumber = require('../../../utils/generate-random-number');
const eventLogger = require('../event-logger');

const getEventDaysAndOtp = async (eventId, eventTimings, timeZone, userId, ctx) => {
  try {
    const generateOtpData = [];
    let totalDays = 0;
    const [regularizeRequestPriceMultiplier] = await getConfigByKey([REGULARIZE_REQUEST_PRICE_MULTIPLIER]);

    for (const eventTime of eventTimings) {
      const { endDate: endedAt, startDate: startedAt, id: eventTimingsId } = eventTime;

      const localStartedAt = moment(startedAt).tz(timeZone).format(); // LOCAL STARTED AT (DEFAULT TIMEZONE ASIA/KOLKATA)
      const localEndedAt = moment(endedAt).tz(timeZone).format(); // LOCAL ENDED AT (DEFAULT TIMEZONE ASIA/KOLKATA)
      const localStartedAtNextDay = moment(localStartedAt).tz(timeZone).add(1, 'days'); // LOCAL NEXT DAY OF STARTED AT (DEFAULT TIMEZONE ASIA/KOLKATA)

      const hoursDiff = moment(endedAt).diff(startedAt, 'hours');
      const endTime = moment(localEndedAt).tz(timeZone).format('HH'); // fetch end time in hours

      const isSameEndDate = moment(localStartedAtNextDay).isSame(localEndedAt, 'day'); // check event end on same day

      // check for hours and event time for extra charges
      if (hoursDiff > REGULARIZE_REQUEST_VALIDATION_HOURS && isSameEndDate && endTime > REGULARIZE_REQUEST_VALIDATION_END_TIME) {
        totalDays += parseFloat(regularizeRequestPriceMultiplier);
      } else {
        totalDays += 1;
      }

      const otp = generateRandomNumber(); // generate random OTP (DEFAULT = 4)
      const otpData = {
        eventId, eventTimingsId, userId, otp,
      };
      generateOtpData.push(otpData);
    }

    const response = {
      totalDays, generateOtpData,
    };

    return response;
  } catch (error) {
    eventLogger(`Error while getEventDaysAndOtp : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getEventDaysAndOtp;
