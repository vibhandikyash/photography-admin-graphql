const { SUCCESS } = require('../../../constants/service-constants');

const { sequelize, Sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');

const updateAttendanceLog = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      models: {
        FreelancerAttendance: FreelancerAttendanceModel,
      },
      localeService,
    } = ctx;

    const { data } = args;
    const { id } = args.where;
    const { user } = ctx.req;
    const { firstClockIn, lastClockOut } = data;

    const existingAttendanceLog = await FreelancerAttendanceModel.findByPk(id);

    if (!existingAttendanceLog) {
      throw new CustomApolloError(getMessage('LOG_NOT_FOUND', localeService));
    }

    const logData = {
      firstClockIn,
      lastClockOut,
      updatedBy: user.id,
      otp: null,
    };

    await FreelancerAttendanceModel.update(logData, { where: { id } }, { transaction });
    await transaction.commit();

    const response = {
      status: SUCCESS,
      message: getMessage('LOG_UPDATED_SUCCESSFULLY', localeService),
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventsLogger(`Error updating-freelancer attendance: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateAttendanceLog;
