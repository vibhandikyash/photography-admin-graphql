const defaultLogger = require('../logger');

const roleObj = require('./data/role');

const createRole = async models => {
  try {
    const { Role: RoleModel } = models;

    const roles = async () => {
      try {
        const roleData = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const role of roleObj) {
          // eslint-disable-next-line no-await-in-loop
          const count = await RoleModel.count({
            where: { roleKey: role.roleKey },
          });
          if (!count) {
            roleData.push(role);
          }
        }
        if (roleData.length) {
          await RoleModel.bulkCreate(roleData);
        }
      } catch (error) {
        defaultLogger(`Error while bulk create roles > ${error}`, null, 'error');
        throw error;
      }
    };

    setTimeout(async () => {
      await roles();
    }, 10000);
  } catch (error) {
    defaultLogger(`Error while creating role ${error}`, null, 'error');
  }
};

module.exports = createRole;
