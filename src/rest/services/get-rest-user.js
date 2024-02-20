const defaultLogger = require('../../logger');
const { models: { User: UserModel, UserProfile: UserProfileModel } } = require('../../sequelize-client');
const getDecodedToken = require('../../utils/auth/get-decoded-token');

const { ApiError } = require('./custom-api-error');

const { UNAUTHENTICATED, NOT_FOUND } = require('./http-status-codes');

const getRestUser = async (token, localeService) => {
  if (!token) {
    throw new ApiError('NOT_LOGGEDIN', UNAUTHENTICATED);
  }

  if (!token.startsWith('Bearer ')) {
    throw new ApiError('INVALID_TOKEN', UNAUTHENTICATED);
  }

  const authToken = token.slice(7, token.length);
  try {
    const decodedToken = await getDecodedToken(authToken, localeService);
    const user = await UserModel.findByPk(decodedToken.userId, {
      include: [
        {
          model: UserProfileModel,
          as: 'profile',
          attributes: ['typeKey', 'isFeatured'],
        },
      ],
    });
    if (!user || user.accountDeletedAt !== null) {
      throw new ApiError('USER_NOT_FOUND', NOT_FOUND);
    }
    return user;
  } catch (error) {
    defaultLogger(`Error from get-rest-user > ${error}`, null, 'error');
    throw error;
  }
};

module.exports = getRestUser;
