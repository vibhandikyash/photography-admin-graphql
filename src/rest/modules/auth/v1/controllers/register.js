const { validationResult } = require('express-validator');

const { allowedRoles } = require('../../../../../constants/constants');

const defaultLogger = require('../../../../../logger');
const {
  models: {
    User: UserModel,
    UserType: UserTypeModel,
    UserProfile: UserProfileModel,
    UserBusiness: UserBusinessModel,
  }, Sequelize, sequelize,
} = require('../../../../../sequelize-client');
const sendEmailForEmailVerification = require('../../../../../shared-lib/emails/profile/send-email-for-email-verification');
const sendEmailForRegistration = require('../../../../../shared-lib/emails/profile/send-email-for-registration');
const { sendOtp } = require('../../../../../shared-lib/msg91');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  CREATED, BAD_REQUEST, FORBIDDEN, VALIDATION_FAILED,
} = require('../../../../services/http-status-codes');

const registerUser = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }

    const {
      fullName, email, contactNo, countryCode, role,
    } = req.body;

    // Check if the user is already registered or not with the same mobile_number and email
    const { Op } = Sequelize;
    const existingEmail = await UserModel.findAll({ where: { email: { [Op.iLike]: email }, accountDeletedAt: null }, paranoid: false });

    const existingContact = await UserModel.findAll({ where: { contactNo, accountDeletedAt: null }, paranoid: false });

    if (existingEmail.length) {
      // Check only freelancers & recruiters are allowed to login
      if (!allowedRoles.includes(existingEmail[0].role)) throw new ApiError('FORBIDDEN', FORBIDDEN);
      throw new ApiError('EMAIL_ALREADY_EXISTS', BAD_REQUEST);
    }

    if (existingContact.length) {
      // Check only freelancers & recruiters are allowed to login
      if (!allowedRoles.includes(existingContact[0].role)) throw new ApiError('FORBIDDEN', FORBIDDEN);
      throw new ApiError('CONTACT_ALREADY_EXISTS', BAD_REQUEST);
    }

    // Set default type based on the user's role
    let typeObj;
    if (role === 'FREELANCER') {
      typeObj = await UserTypeModel.findOne({ where: { key: 'FREE', category: role } });
    } else if (role === 'RECRUITER') {
      typeObj = await UserTypeModel.findOne({ where: { key: 'NON_PAID', category: role } });
    }

    // create user
    const userObj = await UserModel.create({
      fullName,
      email,
      contactNo,
      countryCode,
      role,
      profile: {
        typeKey: typeObj.key,
      },
      business: {
        projectsCompleted: 0,
      },
    }, {
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
      throw new ApiError(getMessage('OTP_SENT_ERROR'), BAD_REQUEST);
    }

    await transaction.commit();

    // email for email verification
    sendEmailForEmailVerification(userObj.id);

    // email for registration successful
    sendEmailForRegistration(userObj.id);

    return sendSuccessResponse(res, 'REGISTER_OTP_SUCCESS', CREATED);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    defaultLogger(`Error while registering user: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = registerUser;
