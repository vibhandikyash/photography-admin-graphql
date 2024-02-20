/* eslint-disable no-use-before-define */

const { groupBy } = require('lodash');

const {
  ROLE_PERMISSIONS,
} = require('../constants/service-constants');
const defaultLogger = require('../logger');
const { setCacheData, getCachedData } = require('../redis-client');

const { models } = require('../sequelize-client');

const CACHE_KEY = ROLE_PERMISSIONS;

const getRoleModule = async (isForceUpdate = false) => {
  try {
    const { RoleModule: RoleModuleModel } = models;
    let cachedRolePermission = null;
    if (!isForceUpdate) {
      cachedRolePermission = await getCachedData(CACHE_KEY);
    }
    if (!cachedRolePermission || cachedRolePermission === null) {
      const roleModuleData = await RoleModuleModel.findAll({ raw: true });

      // eslint-disable-next-line no-restricted-syntax
      const sensitizeData = getRoleModuleDataForSetCache(roleModuleData);

      await setCacheData(CACHE_KEY, sensitizeData, 3600);
      return sensitizeData;
    }
    return cachedRolePermission;
  } catch (error) {
    defaultLogger(`Error From getRoleModule ${error}`, null, 'error');
    throw error;
  }
};

const getRoleModuleDataForSetCache = roleModuleData => {
  const roleWiseData = groupBy(roleModuleData, 'roleKey');
  const keyWiseData = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(roleWiseData)) {
    const filterData = {};
    const moduleKeyWiseData = groupBy(roleWiseData[key], 'moduleKey');
    // eslint-disable-next-line no-restricted-syntax
    for (const moduleWiseKey of Object.keys(moduleKeyWiseData)) {
      // eslint-disable-next-line prefer-destructuring, prefer-destructuring
      filterData[moduleWiseKey] = moduleKeyWiseData[moduleWiseKey][0];
    }
    keyWiseData[key] = filterData;
  }

  return keyWiseData;
};

module.exports = getRoleModule;
