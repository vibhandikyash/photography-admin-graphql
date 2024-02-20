const defaultLogger = require('../../../../../logger');
const { models: { AccessToken: AccessTokenModel }, Sequelize } = require('../../../../../sequelize-client');
const getDecodedToken = require('../../../../../utils/auth/get-decoded-token');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const { extractToken } = require('../services');

const logoutUser = async (req, res, next) => {
  try {
    const authToken = await extractToken(req);
    const decodedToken = await getDecodedToken(authToken);
    const { Op } = Sequelize;
    await AccessTokenModel.destroy({ where: { token: { [Op.iLike]: authToken }, userId: decodedToken.userId } });

    return sendSuccessResponse(res, 'LOGOUT_SUCCESS', 200);
  } catch (error) {
    defaultLogger(`Error while logoutUser: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = logoutUser;
