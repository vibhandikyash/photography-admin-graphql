/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const defaultLogger = require('../logger');

const roleModuleDataObj = require('./data/role-module');

const createRoleModule = async models => {
  try {
    const { RoleModule: RoleModuleModel } = models;

    const roleModules = async () => {
      try {
        const dataToBeGenerate = [];
        for (const roleModule of roleModuleDataObj) {
          const count = await RoleModuleModel.count({
            where: {
              roleKey: roleModule.roleKey,
              moduleKey: roleModule.moduleKey,
            },
          });
          if (!count) {
            dataToBeGenerate.push(roleModule);
          }
        }
        if (dataToBeGenerate.length) {
          await RoleModuleModel.bulkCreate(dataToBeGenerate);
        }
      } catch (error) {
        defaultLogger(`Error while create roleModules > ${error}`, null, 'error');
        throw error;
      }
    };

    setTimeout(async () => {
      await roleModules();
    }, 10000);
  } catch (error) {
    defaultLogger(`Error while creating role module ${error}`, null, 'error');
  }
};

module.exports = createRoleModule;
