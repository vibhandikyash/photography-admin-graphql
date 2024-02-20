const moment = require('moment');

const {
  SUCCESS, UPCOMING, ONGOING, FREELANCER, RECRUITER, REJECTED,
} = require('../../../../../constants/service-constants');
const defaultLogger = require('../../../../../logger');
const {
  models: {
    User: UserModel, AccessToken: AccessTokenModel,
    Event: EventModel, EventFreelancer: EventFreelancerModel,
  }, Sequelize, sequelize,
} = require('../../../../../sequelize-client');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  OK, INVALID_INPUT, FORBIDDEN, NOT_FOUND,
} = require('../../../../services/http-status-codes');

const deleteUserAccount = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const { user: { id: userId, role } } = req;
    if (!validateUUID(userId)) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    const user = await UserModel.findByPk(userId);
    if (!user || user.accountDeletedAt !== null) throw new ApiError('USER_NOT_FOUND', NOT_FOUND);
    // CHECK IF USER IS ACTIVELY ASSIGNED TO THE EVENT
    let events;
    if (role === FREELANCER) {
      events = await EventModel.count({
        where: { status: [ONGOING, UPCOMING] },
        include: {
          model: EventFreelancerModel,
          as: 'freelancers',
          where: { isAssigned: true, userId },
          required: true,
        },
      });
    } else if (role === RECRUITER) {
      events = await EventModel.count({ where: { status: [ONGOING, UPCOMING], recruiterId: userId } });
    }
    if (events > 0) {
      throw new ApiError('NOT_ALLOWED_TO_DELETE_ACCOUNT', FORBIDDEN);
    }
    let { email, contactNo } = user;
    email = `deleted_${userId}_${email}`;
    contactNo = `deleted_${userId}_${contactNo}`;

    await UserModel.update({
      email, contactNo, isActive: false, accountDeletedAt: moment(), verificationStatus: REJECTED,
    }, { where: { id: userId }, transaction });
    await AccessTokenModel.destroy({ where: { userId }, transaction });
    await transaction.commit();
    return sendSuccessResponse(res, SUCCESS, OK);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    defaultLogger(`Error while deleting user account: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = deleteUserAccount;
