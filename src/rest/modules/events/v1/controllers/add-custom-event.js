const moment = require('moment');

const { DEFAULT_TIMEZONE } = require('../../../../../constants/service-constants');
const {
  FreelancerCalender: CalenderModel,
  sequelize,
  Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const { OK, BAD_REQUEST, INVALID_INPUT } = require('../../../../services/http-status-codes');
const eventLogger = require('../../event-logger');

/**
 * Get the user's availability on the provided date range.
 * All Validation should done before calling this function
 * @param {UUID} userId
 * @param {dateTime} startDate
 * @param {dateTime} endDate
 * @returns {integer} count
 */
const getUserCalendarCount = async (userId, startDate, endDate) => {
  const sqlCountQuery = `select count(*) from freelancer_calenders fc
  where fc.user_id = :userId and ( fc.start_date between :startDate and :endDate or fc.end_date between :startDate and :endDate)
  and fc."deleted_at" is null`;
  const replacements = { userId, startDate, endDate };
  const dataCount = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

  const count = parseInt(dataCount[0].count, 10);
  return count;
};

const addCustomEvent = async (req, res, next) => {
  try {
    const { user } = req;
    const { note, timeZone = DEFAULT_TIMEZONE } = req.body;
    const { startDate, endDate } = req.body;

    const localStartOfDay = moment().tz(timeZone).startOf('day').format(); // START OF LOCAL DAY TIMEZONE (DEFAULT ASIA/KOLKATA)

    // Date validation accepted current date
    if (moment(startDate).isBefore(localStartOfDay) || moment(endDate).isBefore(localStartOfDay)) {
      throw new ApiError('INVALID_DATE_RANGE', INVALID_INPUT);
    }

    // Validate duplication
    const eventCount = await getUserCalendarCount(user.id, startDate, endDate);
    if (eventCount) {
      throw new ApiError('CALENDAR_OCCUPIED', BAD_REQUEST);
    }
    const calenderData = {
      userId: user.id, startDate, endDate, note,
    };
    const response = await CalenderModel.create(calenderData);
    return sendSuccessResponse(res, 'SUCCESS', OK, response);
  } catch (error) {
    eventLogger(`Error from adding-custom-event: ${error.message}`, req, 'error');
    return next(error);
  }
};

module.exports = addCustomEvent;
