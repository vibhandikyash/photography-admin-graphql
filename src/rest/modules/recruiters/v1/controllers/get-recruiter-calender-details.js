const moment = require('moment');

const {
  sequelize,
  Sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const { OK, BAD_REQUEST } = require('../../../../services/http-status-codes');
const recruitersLogger = require('../../recruiters-logger');

const getCalenderDetails = async (req, res, next) => {
  try {
    const { user } = req;

    let { startDate = moment().startOf('month'), endDate = moment().endOf('month') } = req.query;

    if (!moment(startDate).isValid() || !moment(endDate).isValid() || moment(endDate).isBefore(startDate)) {
      throw new ApiError('INVALID_INPUT', BAD_REQUEST);
    }

    // Took start & end of the day
    startDate = moment(startDate).toISOString();
    endDate = moment(endDate).toISOString();

    const sqlDataQuery = `select fc.start_date as "startDate", fc.end_date as "endDate"  from freelancer_calenders fc
    where fc.user_id = :userId and ( fc.start_date between :startDate and :endDate or fc.end_date between :startDate and :endDate)
    and fc."deleted_at" is null order by "startDate" ASC`;
    const replacements = { userId: user.id, startDate, endDate };

    const calenderDetails = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    return sendSuccessResponse(res, 'SUCCESS', OK, { calenderDetails });
  } catch (error) {
    recruitersLogger(`Error from recruiter-get-calender-details: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getCalenderDetails;
