const moment = require('moment');
const { Op } = require('sequelize');

const { SUCCESS } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const createCustomEvent = async (_, args, ctx) => {
  try {
    const { models: { FreelancerCalender: FreelancerCalenderModel }, req: { user: { id: userId } }, localeService } = ctx;
    const { data: { startDate, endDate, note } } = args;

    // validate startTime and endTime
    if (moment(startDate).isAfter(endDate)) {
      throw new CustomApolloError(getMessage('STARTDATE_MUST_NOT_EXCEED_ENDDATE', localeService));
    }
    const existingCalendarData = await FreelancerCalenderModel.findAll({
      where: {
        userId,
        [Op.and]: [{ [Op.or]: [{ startDate: { [Op.between]: [startDate, endDate] } }, { endDate: { [Op.between]: [startDate, endDate] } }] }],
      },
    });
    if (existingCalendarData.length) {
      throw new CustomApolloError(getMessage('CALENDAR_OCCUPIED', localeService));
    }
    const data = {
      startDate, endDate, note, userId,
    };
    await FreelancerCalenderModel.create(data);
    const response = {
      status: SUCCESS,
      message: getMessage('CUSTOM_EVENT_CREATED_SUCCESSFULLY', localeService),
    };
    return response;
  } catch (error) {
    freelancerLogger(`Error from creating custom event from web: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createCustomEvent;
