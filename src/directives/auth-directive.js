/* eslint-disable no-restricted-syntax */
/* eslint-disable security/detect-object-injection */
const { get, pickBy, keys } = require('lodash');

const {
  SUPER_ADMIN, WEDLANCER_COORDINATOR, SALES, FINANCE, DISPUTE_MANAGER, PERMISSION_ACCESS_PRIORITY, ADMIN,
} = require('../constants/service-constants');
const { CustomAuthenticationError, CustomForbiddenError } = require('../shared-lib/error-handler');
const getUser = require('../utils/auth/get-user');
const getRoleModule = require('../utils/get-role-module');
const { getMessage } = require('../utils/messages');

const systemUsers = [SUPER_ADMIN, ADMIN, WEDLANCER_COORDINATOR, SALES, FINANCE, DISPUTE_MANAGER];

const directiveResolvers = {
  isAuthenticated: async (next, source, args, ctx) => {
    const { localeService } = ctx;
    const authToken = get(ctx, 'req.headers.authorization');
    const user = await getUser(authToken, localeService);

    if (!user) {
      throw new CustomAuthenticationError(getMessage('UNAUTHENTICATED', localeService));
    }

    // CHECK IF USER IS BLOCKED BY ADMIN
    if (user.isActive === false) {
      throw new CustomAuthenticationError(getMessage('USER_IS_DEACTIVATED', localeService), 'USER_DEACTIVATED');
    }

    ctx.req.user = user;
    return next();
  },
  hasRole: async (next, source, { roles }, ctx) => {
    const { localeService } = ctx;
    const authToken = get(ctx, 'req.headers.authorization');
    const user = await getUser(authToken, localeService);

    if (!user) {
      throw new CustomAuthenticationError(getMessage('USER_NOT_FOUND', localeService));
    }

    // CHECK IF USER IS BLOCKED BY ADMIN
    if (user.isActive === false) {
      throw new CustomAuthenticationError(getMessage('USER_IS_DEACTIVATED', localeService), 'USER_DEACTIVATED');
    }

    if (roles.includes(user.role)) {
      ctx.req.user = user;
      return next();
    }
    throw new CustomAuthenticationError(getMessage('UNAUTHORIZED', localeService));
  },
  hasPermission: async (next, source, { permissions }, ctx) => {
    const { user: { role } } = ctx.req;
    const { localeService } = ctx;
    const roleModuleData = await getRoleModule();
    if (role === SUPER_ADMIN || role === ADMIN) {
      return next();
    }

    for (const permission of permissions) {
      const { modules, access } = permission;
      const updatedPermission = keys(pickBy(roleModuleData[role][modules], value => value === true));
      const updatedPermissionKey = get(updatedPermission, '[0]');
      const updatedPermissionIndex = PERMISSION_ACCESS_PRIORITY.indexOf(updatedPermissionKey);
      const defaultPermissionIndex = PERMISSION_ACCESS_PRIORITY.indexOf(access);
      // PRIORITY OF ACCESS IN ASC ORDER IS READ_ONLY_ACCESS, MODERATE_ACCESS AND FULL_ACCESS
      if (defaultPermissionIndex <= updatedPermissionIndex) {
        return next();
      }
    }
    throw new CustomForbiddenError(getMessage('UNAUTHORIZED', localeService));
  },
  isSystemUser: async (next, source, args, ctx) => {
    const { user } = ctx.req;
    const { localeService } = ctx;
    const isValidUser = systemUsers.includes(user.role);
    if (isValidUser) {
      return next();
    }

    throw new CustomAuthenticationError(getMessage('UNAUTHORIZED', localeService));
  },
};

module.exports = { directiveResolvers };
