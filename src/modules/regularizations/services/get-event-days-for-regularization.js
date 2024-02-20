/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

const { CONFIGURATION_KEYS: { REGULARIZE_REQUEST_PRICE_MULTIPLIER } } = require('../../../constants/service-constants');
const { getConfigByKey } = require('../../../shared-lib/configurations');
const regularizationLogger = require('../regularization-logger');

const checkExtraHoursCriteria = require('./check-extra-hours-criteria');

const getEventDaysForRegularization = async (eventTimeZone, eventTimings, ctx) => {
  try {
    // GET THE REGULARIZE REQUEST PRICE MULTIPLIER
    const [regularizeRequestPriceMultiplier] = await getConfigByKey([REGULARIZE_REQUEST_PRICE_MULTIPLIER]);
    let totalNoOfEventDays = 0;
    for (const eventTime of eventTimings) {
      const { endDate: endedAt, startDate: startedAt } = eventTime;
      const isEventExtraHours = checkExtraHoursCriteria(eventTimeZone, startedAt, endedAt, null);
      // CHECK FOR HOURS AND EVENT TIME FOR EXTRA CHARGES
      if (isEventExtraHours) {
        totalNoOfEventDays += parseFloat(regularizeRequestPriceMultiplier);
      } else {
        totalNoOfEventDays += 1;
      }
    }
    return totalNoOfEventDays;
  } catch (error) {
    regularizationLogger(`Error from getEventDaysForRegularization, ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getEventDaysForRegularization;
