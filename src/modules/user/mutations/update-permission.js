const Sequelize = require('sequelize');

const { sequelize } = require('../../../sequelize-client');
const getRoleModule = require('../../../utils/get-role-module');
const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const updatePermission = async (_, args, ctx) => {
  let transaction;
  try {
    const accessKeys = {
      fullAccess: false, readOnlyAccess: false, moderateAccess: false, noAccess: false,
    };
    const { models, localeService } = ctx;
    const { RoleModule: RoleModuleModel } = models;
    const { data, where } = args;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    accessKeys[data.accessType] = data.value;

    // eslint-disable-next-line no-unused-vars
    const [count, updatedInstance] = await RoleModuleModel.update(accessKeys, {
      where,
      transaction,
      returning: true,
    });

    const response = {
      message: getMessage('PERMISSION_UPDATED_SUCCESSFULLY', localeService),
      status: 'SUCCESS',
      data: updatedInstance,
    };

    await transaction.commit();
    await getRoleModule(true);
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    userLogger(`Error from update permission : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updatePermission;
