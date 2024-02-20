/* eslint-disable prefer-const */
const crypto = require('crypto');

const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Op } = require('sequelize');

const { SALT } = require('../../../config/config');

const CONFIG = require('../../../config/config');
const { SUPER_ADMIN } = require('../../../constants/service-constants');
const { CustomAuthenticationError } = require('../../../shared-lib/error-handler/custom-authentication-error');

const generateToken = require('../../../utils/auth/generate-token');
const { getMessage } = require('../../../utils/messages');

const userLogger = require('../user-logger');

const login = async (_, args, ctx) => {
  try {
    let { email, password } = args.data;
    const { User: UserModel, AccessToken: AccessTokenModel, RoleModule: RoleModuleModel } = ctx.models;
    const { localeService } = ctx;
    const userInstance = await UserModel.findOne(
      {
        where: { email: { [Op.iLike]: email }, accountDeletedAt: null },
        attributes: [
          'id', 'fullName', 'userName', 'isActive', 'verificationStatus',
          'contactNo', 'email', 'emailVerified', 'password', 'refreshToken', 'role',
          'createdBy', 'updatedBy',
        ],
      },
    );

    if (!userInstance) {
      throw new CustomAuthenticationError(getMessage('UNAUTHORIZED', localeService));
    }

    const isValidPassword = crypto.pbkdf2Sync(password, SALT, 1000, 64, 'sha512').toString('hex') === userInstance.password;

    if (!isValidPassword) {
      throw new CustomAuthenticationError(getMessage('INVALID_CREDENTIALS', localeService));
    }
    if (!userInstance.isActive) {
      throw new CustomAuthenticationError(getMessage('INACTIVE_USER', localeService));
    }

    const token = await generateToken(userInstance.id);

    const accessTokenObj = {
      token,
      tokenExpiry: moment().add(2880, 'minutes'),
      userId: userInstance.id,
    };
    await AccessTokenModel.create(accessTokenObj);

    let refreshToken;
    if (userInstance.refreshToken) {
      refreshToken = userInstance.refreshToken;
    } else {
      refreshToken = jwt.sign({ userId: userInstance.id }, CONFIG.JWT.SECRET);
      await UserModel.update({ refreshToken }, { where: { id: userInstance.id } });
    }

    let getRoleData;
    if (userInstance.role !== SUPER_ADMIN) {
      getRoleData = await RoleModuleModel.findAll({
        where: { roleKey: userInstance.role },
        attributes: ['moduleKey', 'fullAccess', 'moderateAccess', 'readOnlyAccess', 'noAccess'],
      });
    }

    const response = {
      token,
      refreshToken,
      user: userInstance,
      rolePermission: getRoleData,
    };
    return response;
  } catch (error) {
    userLogger(`Error while login : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = login;
