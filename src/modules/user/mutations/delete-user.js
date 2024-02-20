const moment = require('moment');
const Sequelize = require('sequelize');

const { SUPER_ADMIN, ADMIN, REJECTED } = require('../../../constants/service-constants');
const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler/custom-apollo-error');
const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const deleteUser = async (_, args, ctx) => {
  let transaction;
  try {
    const { models, localeService, req: { user: { role: loggedInUserRole, id: userId } } } = ctx;
    const { User: UserModel, AccessToken: AccessTokenModel } = models;
    const { where: { id = 0 } } = args;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const checkUserInstance = await UserModel.findByPk(id);

    if (!checkUserInstance || checkUserInstance.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }

    if (loggedInUserRole === ADMIN && (checkUserInstance.role === SUPER_ADMIN || userId === id)) {
      throw new CustomApolloError(getMessage('UNAUTHORIZED', localeService));
    }

    let { email, contactNo } = checkUserInstance;
    email = `deleted_${id}_${email}`;
    contactNo = `deleted_${id}_${contactNo}`;
    const currentDate = moment();
    await UserModel.update({
      email, contactNo, isActive: false, accountDeletedAt: currentDate, verificationStatus: REJECTED,
    }, { where: { id }, transaction, returning: true });

    await AccessTokenModel.destroy({
      where: {
        userId: id,
      },
      transaction,
    });

    const response = {
      message: getMessage('USER_DELETE_SUCCESS', localeService),
      status: 'SUCCESS',
    };

    await transaction.commit();
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    userLogger(`Error from delete user : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = deleteUser;
