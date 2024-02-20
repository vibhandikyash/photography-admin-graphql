const moment = require('moment');

const {
  SUCCESS, ONGOING, UPCOMING, REJECTED,
} = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const recruiterLogger = require('../recruiter-logger');

const removeRecruiter = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const { models: { User: UserModel, AccessToken: AccessTokenModel, Event: EventModel }, localeService } = ctx;

    const recruiterInstance = await UserModel.findOne({ where: { id: args.id, role: 'RECRUITER', accountDeletedAt: null } });

    if (!recruiterInstance) {
      throw new CustomApolloError(getMessage('RECRUITER_NOT_FOUND', localeService));
    }

    const events = await EventModel.findAll({
      where: { status: [ONGOING, UPCOMING], recruiterId: args.id },
    });
    if (events.length) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_REMOVE_USER'), localeService);
    }
    let { email, contactNo } = recruiterInstance;
    email = `deleted_${args.id}_${email}`;
    contactNo = `deleted_${args.id}_${contactNo}`;
    await UserModel.update({
      email, contactNo, isActive: false, accountDeletedAt: moment(), verificationStatus: REJECTED,
    }, { where: { id: args.id }, returning: true });

    await AccessTokenModel.destroy({
      where: {
        userId: args.id,
      },
      transaction,
    });

    await transaction.commit();

    const response = {
      status: SUCCESS,
      message: getMessage('RECRUITER_REMOVED', localeService),
    };

    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    recruiterLogger(`Error from remove recruiter: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = removeRecruiter;
