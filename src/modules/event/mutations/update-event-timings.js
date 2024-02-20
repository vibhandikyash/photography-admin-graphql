/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const moment = require('moment');

const { SUCCESS, EVENT_HOURS_DIFF, UPCOMING } = require('../../../constants/service-constants');
const { Sequelize, sequelize } = require('../../../sequelize-client');

const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');

const updateEventTimings = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const { models: { EventTiming: EventTimingsModel, Event: EventModel }, localeService } = ctx;

    const { data: { timings = [] } = {}, where: { id: eventId } = {} } = args;
    const event = await EventModel.findByPk(eventId);

    if (!event) {
      throw new CustomApolloError(getMessage('EVENT_NOT_FOUND', localeService));
    }
    const { status } = event;
    if (status !== UPCOMING) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_UPDATE_TIMINGS', localeService));
    }
    const { startDate: eventStartDate, endDate: eventEndDate } = event;
    for (const timing of timings) {
      const { id, startDate, endDate } = timing;
      // VALIDATE STARTTIME AND ENDTIME
      if (moment(startDate).isAfter(endDate)) {
        throw new CustomApolloError(getMessage('STARTDATE_MUST_NOT_EXCEED_ENDDATE', localeService));
      }
      const inputDateDiff = moment(endDate).diff(startDate, 'hours');
      if (inputDateDiff > EVENT_HOURS_DIFF) {
        throw new CustomApolloError(getMessage('TOTAL_HOURS_VALIDATION_MESSAGE', localeService, { hours: EVENT_HOURS_DIFF }), localeService);
      }

      const validateStartDate = moment(startDate).isBetween(eventStartDate, eventEndDate, null, '[]');

      if (!validateStartDate) {
        throw new CustomApolloError(getMessage('INVALID_TIMINGS', localeService));
      }
      await EventTimingsModel.update({ startDate, endDate }, { where: { id }, transaction });
    }
    await transaction.commit();

    const response = {
      status: SUCCESS,
      message: getMessage('TIMINGS_UPDATED_SUCCESSFULLY', localeService),
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventsLogger(`Error updating-event timings: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateEventTimings;
