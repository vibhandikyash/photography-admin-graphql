const defaultLogger = require('../../logger');
const { models: { User: UserModel } } = require('../../sequelize-client');
const { CustomAuthenticationError } = require('../../shared-lib/error-handler');
const { getMessage } = require('../messages');

const getDecodedToken = require('./get-decoded-token');

const getUser = async (token, localeService) => {
  if (!token) {
    throw new CustomAuthenticationError(getMessage('NOT_LOGGEDIN', localeService), 'LOGIN_REQUIRED');
  }

  if (!token.startsWith('Bearer ')) {
    throw new CustomAuthenticationError(getMessage('INVALID_TOKEN', localeService), 'INVALID_TOKEN');
  }

  const authToken = token.slice(7, token.length);
  try {
    const decodedToken = await getDecodedToken(authToken, localeService);
    const user = await UserModel.findOne({ where: { id: decodedToken.userId, accountDeletedAt: null } });
    return user;
  } catch (error) {
    defaultLogger(`Error from getUser > ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getUser;
