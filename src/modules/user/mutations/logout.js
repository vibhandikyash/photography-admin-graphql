const Sequelize = require('sequelize');

const { CustomApolloError } = require('../../../shared-lib/error-handler/custom-apollo-error');

const { Op } = Sequelize;

const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const logout = async (_, args, ctx) => {
  try {
    const { user, headers } = ctx.req;
    const {
      User: UserModel,
      AccessToken: AccessTokenModel,
    } = ctx.models;
    const { localeService } = ctx;
    const token = headers.authorization;
    const authToken = token.slice(7, token.length);

    const userInstance = await UserModel.findByPk(user.id);

    if (!userInstance || userInstance.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('USER_NOT_FOUND', localeService));
    }

    await AccessTokenModel.destroy({ where: { token: { [Op.iLike]: authToken } } });

    const response = {
      message: getMessage('LOGOUT_SUCCESS', localeService),
    };

    return response;
  } catch (error) {
    userLogger(`Error while logout : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = logout;
