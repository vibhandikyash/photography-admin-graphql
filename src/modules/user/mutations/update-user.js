const Sequelize = require('sequelize');

const { ADMIN, SUPER_ADMIN } = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler/custom-apollo-error');
const { getMessage } = require('../../../utils/messages');

const userLogger = require('../user-logger');

const updateUser = async (_, args, ctx) => {
  let transaction;
  try {
    const { user: { id: userId, role: loggedInUserRole } } = ctx.req;
    const { User: UserModel } = ctx.models;
    const { localeService } = ctx;
    const { where = {} } = args;
    const { data } = args;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    let userInstance = await UserModel.findByPk(where.id);

    if (!userInstance || userInstance.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }

    const { role: userRole } = userInstance;
    if (loggedInUserRole === ADMIN && userRole === SUPER_ADMIN) {
      throw new CustomApolloError(getMessage('UNAUTHORIZED', localeService));
    }

    if (data.user) {
      delete data.password;
      data.user.updatedBy = userId;
      [, [userInstance]] = await UserModel.update(data.user, {
        where: {
          id: where.id,
        },
        transaction,
        returning: true,
      });
    }

    const response = {
      message: getMessage('USER_UPDATE_SUCCESS', localeService),
      status: 'SUCCESS',
      data: userInstance,
    };

    await transaction.commit();
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    userLogger(`Error from  user update : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateUser;
