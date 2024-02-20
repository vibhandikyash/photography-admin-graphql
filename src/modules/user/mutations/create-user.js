const Sequelize = require('sequelize');

const { PASSWORD_REGEX } = require('../../../constants/regex-constants');
const { SUPER_ADMIN, ADMIN } = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { generatePassword } = require('../../../utils/auth/generate-password');
const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const createUser = async (_, args, ctx) => {
  let transaction;
  try {
    const { models, req, localeService } = ctx;
    const { user: { id: userId, role: loggedInUserRole } } = req;
    const { User: UserModel } = models;
    const { data } = args;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const { role: newUserRole } = data;
    if (loggedInUserRole === ADMIN && (newUserRole === SUPER_ADMIN || newUserRole === ADMIN)) {
      throw new CustomApolloError(getMessage('UNAUTHORIZED', localeService));
    }

    const checkUserEmail = await UserModel.findOne({
      where: { email: { [Sequelize.Op.iLike]: data.email }, accountDeletedAt: null },
    });

    const checkUserContact = await UserModel.findOne({ where: { contactNo: data.contactNo, accountDeletedAt: null } });

    data.fullName = data.fullName.trim();
    data.userName = data.userName.trim();

    if (checkUserEmail) {
      throw new CustomApolloError(getMessage('EMAIL_ALREADY_EXISTS', localeService));
    }

    if (checkUserContact) {
      throw new CustomApolloError(getMessage('CONTACT_ALREADY_EXISTS', localeService));
    }

    if (!PASSWORD_REGEX.test(data.password)) {
      throw new CustomApolloError(getMessage('STRONG_PASSWORD_REQUIRED', localeService));
    }

    data.password = await generatePassword(data.password);
    data.createdBy = userId;

    const userInstance = await UserModel.create(data, {
      transaction,
    });

    delete userInstance.password;
    const response = {
      message: getMessage('USER_CREATE_SUCCESS', localeService),
      status: 'SUCCESS',
      data: userInstance,
    };

    await transaction.commit();
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    userLogger(`Error from create user : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createUser;
