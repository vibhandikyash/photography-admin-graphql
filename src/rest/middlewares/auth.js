const moment = require('moment');

const { allowedRoles } = require('../../constants/constants');

const defaultLogger = require('../../logger');
const { models: { AccessToken: AccessTokenModel } } = require('../../sequelize-client');
const getDecodedToken = require('../../utils/auth/get-decoded-token');
const { extractToken } = require('../modules/auth/v1/services');
const { ApiError } = require('../services/custom-api-error');
const getRestUser = require('../services/get-rest-user');
const { NOT_FOUND, UNAUTHENTICATED } = require('../services/http-status-codes');

/**
 * Common authentication for freelancers & recruiters
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.headers.authorization) throw new ApiError('NOT_LOGGEDIN', UNAUTHENTICATED);
    const authToken = await extractToken(req);
    const decodedToken = await getDecodedToken(authToken);
    // Add milliseconds to token expiration time for converting time stamp in moment
    const expTime = decodedToken.exp * 1000;

    // Verify the token in database
    const token = await AccessTokenModel.findOne({ where: { token: authToken } });
    if (!token) throw new ApiError('NOT_LOGGEDIN', UNAUTHENTICATED);

    if (moment(expTime) < moment()) throw new ApiError('TOKEN_EXPIRED', UNAUTHENTICATED); // check token expiration

    const user = await getRestUser(req.headers.authorization);

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', NOT_FOUND);
    }

    // CHECK IF USER IS BLOCKED BY ADMIN
    if (user.isActive === false) {
      throw new ApiError('USER_IS_DEACTIVATED', UNAUTHENTICATED);
    }

    // Only freelancer & recruiter are allowed to login with this routes
    if (!allowedRoles.includes(user.role)) {
      throw new ApiError('UNAUTHORIZED', UNAUTHENTICATED);
    }

    req.user = user;

    return next();
  } catch (error) {
    defaultLogger(`Error while authenticating user ${error.message}`, null, 'error');
    return next(error);
  }
};

/**
 * Check the user have the right role
 * @param {string} role
 * @returns
 */
const roleCheck = (roles = []) => async (req, res, next) => {
  try {
    if (!req.user) throw new ApiError('NOT_LOGGEDIN', UNAUTHENTICATED);

    const { user: { role } } = req;
    if (!roles.includes(role)) {
      throw new ApiError('UNAUTHORIZED', UNAUTHENTICATED);
    }

    return next();
  } catch (error) {
    defaultLogger(`Error while authenticating freelancer user: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = {
  isAuthenticated,
  roleCheck,
};
