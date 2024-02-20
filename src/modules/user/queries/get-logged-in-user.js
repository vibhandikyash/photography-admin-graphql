/* eslint-disable no-shadow */
const { SUPER_ADMIN } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler/custom-apollo-error');
const getUserWithRelationship = require('../../../utils/get-user-with-relationship');

const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const getLoggedInUser = async (_, args, ctx) => {
  try {
    const { models, localeService } = ctx;
    const { user } = ctx.req;
    const {
      User: UserModel,
      UserProfile: UserProfileModel,
      RoleModule: RoleModuleModel,
    } = models;

    const userInstance = await UserModel.findByPk(user.id, {
      include: [{
        model: UserProfileModel,
        as: 'profile',
        attributes: ['isFeatured', 'typeKey'],
      }],
      attributes: [
        'id',
        'fullName',
        'userName',
        'verificationStatus',
        'role',
        'email',
        'contactNo',
        'createdBy',
        'countryCode',
        'updatedBy',
        'isActive',
        'emailVerified',
        'accountDeletedAt',
      ],
    });

    if (!userInstance || userInstance.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }
    userInstance.isFeatured = userInstance?.profile?.isFeatured;
    userInstance.typeKey = userInstance?.profile?.typeKey;

    let rolePermission;
    if (userInstance.role !== SUPER_ADMIN) {
      rolePermission = await RoleModuleModel.findAll({
        where: { roleKey: userInstance.role },
        attributes: ['moduleKey', 'fullAccess', 'moderateAccess', 'readOnlyAccess', 'noAccess'],
      });
    }
    const profile = await getUserWithRelationship(userInstance);
    // CHECK IF THE USER IS COMPLETING ONBOARDING OR NOT BY CHECKING USER'S REQ FEILD
    const key = profile.role === 'FREELANCER' ? profile.userName : profile.business?.companyName;
    const isOnboard = !!key;
    const response = {
      user: userInstance,
      rolePermission,
      isOnboard,
    };

    return response;
  } catch (error) {
    userLogger(`Error from  get loggedin user details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getLoggedInUser;
