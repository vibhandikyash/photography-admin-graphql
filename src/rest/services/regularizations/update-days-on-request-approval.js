/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { round, get } = require('lodash');
const moment = require('moment');

const {
  APPROVED,
  CONFIGURATION_KEYS: { REGULARIZE_REQUEST_PRICE_MULTIPLIER },
  REGULARIZE_REQUEST_TYPES: { REGULARIZE, INSUFFICIENT_HOURS },
  DEFAULT_TIMEZONE,
} = require('../../../constants/service-constants');
const defaultLogger = require('../../../logger');
const getEventDaysForRegularization = require('../../../modules/regularizations/services/get-event-days-for-regularization');
const {
  models: {
    Event: EventModel,
    RegularizeRequest: RegularizeRequestModel,
    EventTiming: EventTimingModel,
  },
} = require('../../../sequelize-client');
const { getConfigByKey } = require('../../../shared-lib/configurations');

const updateDaysOnRequestApproval = async (
  freelancerId,
  eventId,
  requestId,
  requestType,
  isPreviousRequestExtraHours,
  transaction,
) => {
  try {
    const [regularizeRequestPriceMultiplier] = await getConfigByKey([
      REGULARIZE_REQUEST_PRICE_MULTIPLIER,
    ]);

    const event = await EventModel.findByPk(eventId);
    const { timeZone: eventTimeZone = DEFAULT_TIMEZONE } = event;

    const eventTimings = await EventTimingModel.findAll({ where: { eventId } });
    const requestInstances = await RegularizeRequestModel.findAll({
      where: { userId: freelancerId, eventId, status: APPROVED },
      limit: 1,
      order: [['updatedAt', 'desc']],
    });
    const requestInstance = get(requestInstances, '[0]');

    let metaDataToBeUpdated;
    const existingRequest = await RegularizeRequestModel.findByPk(requestId);
    const { metaData: existingRequestMetaData } = existingRequest;

    if (!requestInstance) {
      const eventInstance = await EventModel.findByPk(eventId);
      const { startDate: eventStartDate, endDate: eventEndDate } = eventInstance;
      const totalDays = moment(eventEndDate).diff(moment(eventStartDate), 'days') + 1;
      let updatedNoOfDays;
      if (requestType === REGULARIZE && !isPreviousRequestExtraHours) {
        updatedNoOfDays = totalDays + round(regularizeRequestPriceMultiplier - 1, 2);
        metaDataToBeUpdated = {
          ...existingRequestMetaData,
          oldNoOfDays: totalDays,
          updatedNoOfDays,
        };
      }
      if (requestType === REGULARIZE && isPreviousRequestExtraHours) {
        const totalNoOfEventDays = await getEventDaysForRegularization(
          eventTimeZone,
          eventTimings,
          null,
        );
        updatedNoOfDays = round(
          totalNoOfEventDays - round(regularizeRequestPriceMultiplier - 1, 2),
          2,
        );
        metaDataToBeUpdated = {
          ...existingRequestMetaData,
          oldNoOfDays: totalNoOfEventDays,
          updatedNoOfDays,
        };
      }
      if (requestType === INSUFFICIENT_HOURS) {
        const totalNoOfEventDays = await getEventDaysForRegularization(
          eventTimeZone,
          eventTimings,
          null,
        );
        updatedNoOfDays = round(
          totalNoOfEventDays - round(regularizeRequestPriceMultiplier - 1, 2),
          2,
        );
        metaDataToBeUpdated = {
          ...existingRequestMetaData,
          oldNoOfDays: totalNoOfEventDays,
          updatedNoOfDays,
        };
      }
    } else {
      const { metaData } = requestInstance;
      let updatedNoOfDays;
      if (requestType === REGULARIZE) {
        updatedNoOfDays = round(
          metaData.updatedNoOfDays
            + round(regularizeRequestPriceMultiplier - 1, 2),
          2,
        );
        metaDataToBeUpdated = {
          ...existingRequestMetaData,
          oldNoOfDays: metaData.updatedNoOfDays,
          updatedNoOfDays,
        };
      }
      if (
        requestType === INSUFFICIENT_HOURS
        || (requestType === REGULARIZE && isPreviousRequestExtraHours)
      ) {
        updatedNoOfDays = round(
          metaData.updatedNoOfDays
            - round(regularizeRequestPriceMultiplier - 1, 2),
          2,
        );
        metaDataToBeUpdated = {
          ...existingRequestMetaData,
          oldNoOfDays: metaData.updatedNoOfDays,
          updatedNoOfDays,
        };
      }
    }
    return metaDataToBeUpdated;
  } catch (error) {
    defaultLogger(
      `Error from update-days-on-request-approval: ${error.message}`,
      null,
      'error',
    );
    throw error;
  }
};

module.exports = updateDaysOnRequestApproval;
