/* eslint-disable no-shadow */
const { groupBy, capitalize, sortBy } = require('lodash');

const userLogger = require('../user-logger');

const getUserPermission = async (_, args, ctx) => {
  try {
    const { RoleModule: RoleModuleModel } = ctx.models;
    const roleModuleData = await RoleModuleModel.findAll({ attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }, raw: true });
    // eslint-disable-next-line no-use-before-define
    let formattedData = getFormattedData(roleModuleData);
    formattedData = sortBy(formattedData, 'key');
    // eslint-disable-next-line no-restricted-syntax
    for (const data of formattedData) {
      data.roles = sortBy(data.roles, 'roleKey');
    }
    const response = {
      permission: formattedData,
    };
    return response;
  } catch (error) {
    userLogger(`Error from  get user permission: ${error}`, ctx, 'error');
    throw error;
  }
};

const getFormattedData = roleModuleData => {
  const moduleWiseData = groupBy(roleModuleData, 'moduleKey');
  const keyWiseData = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(moduleWiseData)) {
    const filterData = {};
    const roleKeyWiseData = groupBy(moduleWiseData[key], 'roleKey');
    filterData.key = key;
    filterData.label = key.replaceAll('_', ' ').split(' ').map(capitalize).join(' ');
    filterData.roles = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const roleWiseKey of Object.keys(roleKeyWiseData)) {
      roleKeyWiseData[roleWiseKey][0].label = roleKeyWiseData[roleWiseKey][0]?.roleKey.replaceAll('_', ' ').split(' ').map(capitalize).join(' ');
      // eslint-disable-next-line prefer-destructuring
      filterData.roles.push(roleKeyWiseData[roleWiseKey][0]);
    }
    keyWiseData.push(filterData);
  }
  return keyWiseData;
};

module.exports = getUserPermission;
