const { Op } = require('sequelize');

const { EMAIL_REGEX } = require('../../../constants/regex-constants');
const {
  SUCCESS, FREELANCER, FREE, NON_PAID,
} = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const sendEmailForEmailVerification = require('../../../shared-lib/emails/profile/send-email-for-email-verification');
const sendEmailForRegistration = require('../../../shared-lib/emails/profile/send-email-for-registration');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { sendOtp } = require('../../../shared-lib/msg91');
const { getMessage } = require('../../../utils/messages');
const userLogger = require('../user-logger');

const register = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      data: {
        fullName, email, contactNo, countryCode, role,
      },
    } = args;

    const {
      models: { User: UserModel, UserProfile: UserProfileModel, UserBusiness: UserBusinessModel },
      localeService,
    } = ctx;

    // check email regex
    if (!email.match(EMAIL_REGEX)) {
      throw new CustomApolloError(getMessage('INVALID_EMAIL', localeService));
    }

    const userExist = await UserModel.findOne({
      where: {
        accountDeletedAt: null,
        [Op.or]: [
          { email: { [Op.iLike]: email } },
          { contactNo },
        ],
      },
    });

    if (userExist) {
      const { email: existEmail, contactNo: existContact } = userExist;

      // check email exist or not
      if (existEmail === email) {
        throw new CustomApolloError(getMessage('EMAIL_ALREADY_EXISTS', localeService));
      }

      // check contact exist or not
      if (existContact === contactNo) {
        throw new CustomApolloError(getMessage('CONTACT_ALREADY_EXISTS', localeService));
      }
    }

    const typeKey = role === FREELANCER ? FREE : NON_PAID;

    const createUserData = {
      fullName,
      email,
      contactNo,
      countryCode,
      role,
      profile: { typeKey },
      business: { projectsCompleted: 0 },
    };
    // create user
    const user = await UserModel.create(createUserData, {
      include: [{
        model: UserProfileModel,
        as: 'profile',
      }, {
        model: UserBusinessModel,
        as: 'business',
      },
      ],
      transaction,
    });

    const sendOtpResponse = await sendOtp(`${countryCode}${contactNo}`);
    if (!sendOtpResponse) {
      throw new CustomApolloError(getMessage('OTP_SENT_ERROR', localeService));
    }

    // Increase Otp request attempts
    await UserModel.increment('otpRequestAttempts', { by: 1, where: { id: user.id } });

    await transaction.commit();

    // email for email verification
    sendEmailForEmailVerification(user.id);

    // email for registration successful
    sendEmailForRegistration(user.id);

    const response = { status: SUCCESS, message: getMessage('USER_REG_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    userLogger(`Error while register : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = register;
