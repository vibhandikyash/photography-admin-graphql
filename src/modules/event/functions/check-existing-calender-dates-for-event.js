/* eslint-disable no-restricted-syntax */
const moment = require('moment');

const { models: { FreelancerCalender: FreelancerCalenderModel } } = require('../../../sequelize-client');
const eventLogger = require('../event-logger');

const checkExistingCalenderDatesForEvent = async (recruiterId, startDate, endDate) => {
  try {
    const recruiterCalenderInstance = await FreelancerCalenderModel.findAll({ where: { userId: recruiterId } });
    for (const calender of recruiterCalenderInstance) {
      let { startDate: calenderStartDate, endDate: calenderEndDate } = calender;
      const eventStartDate = moment(startDate);
      const eventEndDate = moment(endDate);
      calenderStartDate = moment(calenderStartDate);
      calenderEndDate = moment(calenderEndDate);
      const validateStartDate = moment(eventStartDate).isBetween(calenderStartDate, calenderEndDate, null, []);
      const validateEndDate = moment(eventEndDate).isBetween(calenderStartDate, calenderEndDate, null, []);
      if (validateStartDate || validateEndDate) {
        return true;
      }
    }
    return false;
  } catch (error) {
    eventLogger(`Error from check existing calender dates for event: ${error}`, null, 'error');
    throw error;
  }
};

module.exports = checkExistingCalenderDatesForEvent;
