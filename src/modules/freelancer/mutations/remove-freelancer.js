const moment = require('moment');

const {
  SUCCESS, ONGOING, UPCOMING, REJECTED,
} = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const removeFreelancer = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      models: {
        User: UserModel, AccessToken: AccessTokenModel, Event: EventModel, EventFreelancer: EventFreelancerModel,
      }, localeService,
    } = ctx;

    const freelancerInstance = await UserModel.findOne({ where: { id: args.id, role: 'FREELANCER', accountDeletedAt: null } });

    if (!freelancerInstance) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }

    const events = await EventModel.findAll({
      where: { status: [ONGOING, UPCOMING] },
      include: {
        model: EventFreelancerModel,
        as: 'freelancers',
        where: { isAssigned: true, userId: args.id },
        required: true,
      },
    });

    if (events.length) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_REMOVE_USER', localeService));
    }

    let { email, contactNo } = freelancerInstance;
    email = `deleted_${args.id}_${email}`;
    contactNo = `deleted_${args.id}_${contactNo}`;
    await UserModel.update({
      email, contactNo, isActive: false, accountDeletedAt: moment(), verificationStatus: REJECTED,
    }, {
      where: {
        id: args.id, role: 'FREELANCER',
      },
    });

    await AccessTokenModel.destroy({
      where: {
        userId: args.id,
      },
      transaction,
    });

    await transaction.commit();

    const response = {
      status: SUCCESS,
      message: getMessage('FREELANCER_REMOVED', localeService),
    };

    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    freelancerLogger(`Error from remove freelancer: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = removeFreelancer;
