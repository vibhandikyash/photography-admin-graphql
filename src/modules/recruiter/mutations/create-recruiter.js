const { pick } = require('lodash');

const { SUCCESS } = require('../../../constants/service-constants');

const { sequelize, Sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const recruiterLogger = require('../recruiter-logger');

const RECRUITER_USER = ['fullName', 'email', 'contactNo', 'countryCode', 'verificationStatus', 'isActive'];
const RECRUITER_PROFILE = ['bio', 'profilePhoto', 'coverPhoto', 'aadharCardFront', 'aadharCardBack', 'typeKey'];
const RECRUITER_BUSINESS = ['companyName', 'instagramLink', 'addressLine1', 'addressLine2', 'city', 'state', 'country', 'zipCode'];

const createRecruiter = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const { models: { User: UserModel, UserProfile: RecruiterProfileModel, UserBusiness: RecruiterBusinessModel }, localeService } = ctx;

    const { data } = args;
    const { user } = ctx.req;

    const existingEmail = await UserModel.findOne({ where: { email: { [Sequelize.Op.iLike]: data.email }, accountDeletedAt: null } });

    const existingContact = await UserModel.findOne({ where: { contactNo: data.contactNo, accountDeletedAt: null } });

    if (existingEmail) {
      throw new CustomApolloError(getMessage('RECRUITER_EMAIL_EXISTS', localeService));
    }

    if (existingContact) {
      throw new CustomApolloError(getMessage('CONTACT_ALREADY_EXISTS', localeService));
    }

    const recruiterUserData = pick(data, RECRUITER_USER);
    const recruiterProfileData = { ...pick(data, RECRUITER_PROFILE), createdBy: user.id };
    const recruiterBusinessData = { ...pick(data, RECRUITER_BUSINESS), createdBy: user.id };
    recruiterUserData.role = 'RECRUITER';
    recruiterUserData.profile = recruiterProfileData;
    recruiterUserData.business = recruiterBusinessData;

    const recruiter = await UserModel.create(recruiterUserData, {
      include: [
        {
          model: RecruiterProfileModel,
          as: 'profile',
        },
        {
          model: RecruiterBusinessModel,
          as: 'business',
        },
      ],
      transaction,
    });

    await transaction.commit();
    const response = {
      status: SUCCESS,
      message: getMessage('RECRUITER_CREATED', localeService),
      id: recruiter.id,
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    recruiterLogger(`Error creating recruiter: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createRecruiter;
