/* eslint-disable consistent-return */
const { models: { User: UserModel } } = require('../../../sequelize-client');
const freelancersLogger = require('../../modules/freelancers/freelancers-logger');

const isDeletedUser = async userId => {
  try {
    const userInstance = await UserModel.findByPk(userId, { attributes: ['id', 'email', 'contactNo', 'role', 'accountDeletedAt'] });
    if (userInstance) {
      const { accountDeletedAt } = userInstance;
      if (accountDeletedAt !== null) {
        return { isDeleted: true, userInstance };
      }
      return { isDeleted: false, userInstance };
    }
    return { isDeleted: true };
  } catch (error) {
    freelancersLogger(`Error from check-is-deleted-user: ${error.message}`, null, 'error');
  }
};

module.exports = isDeletedUser;
