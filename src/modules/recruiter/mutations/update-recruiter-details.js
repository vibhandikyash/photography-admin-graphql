const { pick, isEmpty } = require('lodash');
const { Op } = require('sequelize');

const {
  SUCCESS, RECRUITER, APPROVED, REJECTED,
} = require('../../../constants/service-constants');
const sendEmailForProfileRejection = require('../../../shared-lib/emails/profile/send-email-for-profile-rejection');
const sendEmailForRecruiterApprovedProfile = require('../../../shared-lib/emails/profile/send-email-for-recruiter-approved-profile');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const createNotificationForUserProfileApproval = require('../../../shared-lib/notifications/users/create-notification-for-user-profile-approval');
const createNotificationForUserProfileRejection = require('../../../shared-lib/notifications/users/create-notification-for-user-profile-rejection');
const { getMessage } = require('../../../utils/messages');
const removeOriginFromUrl = require('../../../utils/remove-origin-from-url');
const recruiterLogger = require('../recruiter-logger');

const updateRecruiterDetails = async (_, args, ctx) => {
  try {
    const { models: { User: UserModel, UserBusiness: RecruiterBusinessModel, UserProfile: RecruiterProfileModel }, localeService } = ctx;

    const { data } = args;
    const { id } = args.where;
    const { user } = ctx.req;

    const recruiterInstance = await UserModel.findByPk(id);
    if (!recruiterInstance || recruiterInstance.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('RECRUITER_NOT_FOUND', localeService));
    }

    const RECRUITER_USER = ['fullName', 'email', 'contactNo', 'countryCode', 'verificationStatus', 'isActive'];
    const RECRUITER_PROFILE = ['bio', 'profilePhoto', 'coverPhoto', 'aadharCardFront', 'aadharCardBack', 'typeKey'];
    const RECRUITER_BUSINESS = ['companyName', 'instagramLink', 'addressLine1', 'addressLine2', 'city', 'state', 'country', 'zipCode'];

    const recruiterUserData = pick(data, RECRUITER_USER);
    const recruiterProfileData = pick(data, RECRUITER_PROFILE);
    const recruiterBusinessData = pick(data, RECRUITER_BUSINESS);

    if (recruiterUserData) {
      const { contactNo = null, email = null } = recruiterUserData;
      const existingData = await UserModel.findOne({
        where: {
          [Op.or]: [{ contactNo }, { email }],
          id: { [Op.ne]: id },
          accountDeletedAt: null,
        },
      });
      if (existingData) {
        const { contactNo: existingContactNo, email: existingEmail } = existingData;
        if (!isEmpty(email) && email === existingEmail) {
          throw new CustomApolloError(getMessage('EMAIL_ALREADY_EXISTS', localeService));
        } else if (!isEmpty(contactNo) && contactNo === existingContactNo) {
          throw new CustomApolloError(getMessage('CONTACT_ALREADY_EXISTS', localeService));
        }
      }

      // CHECK EXISTING VERIFICATION STATUS
      const existingStatus = await UserModel.findByPk(id, { attributes: ['verificationStatus'] });
      const { verificationStatus: existingVerificationStatus } = existingStatus;

      if (existingVerificationStatus !== recruiterUserData.verificationStatus) {
        if (recruiterUserData.verificationStatus === APPROVED) {
          createNotificationForUserProfileApproval(user.id, id, RECRUITER, localeService);
          sendEmailForRecruiterApprovedProfile(id);
        } else if (recruiterUserData.verificationStatus === REJECTED) {
          createNotificationForUserProfileRejection(user.id, id, localeService);
          sendEmailForProfileRejection(id); // SEND EMAIL
        }
      }

      await UserModel.update(recruiterUserData, { where: { id }, returning: true });
    }
    if (!isEmpty(recruiterProfileData)) {
      recruiterProfileData.updatedBy = user.id;
      recruiterProfileData.profilePhoto = recruiterProfileData.profilePhoto ? removeOriginFromUrl(recruiterProfileData.profilePhoto) : null;
      recruiterProfileData.coverPhoto = recruiterProfileData.coverPhoto ? removeOriginFromUrl(recruiterProfileData.coverPhoto) : null;
      recruiterProfileData.aadharCardFront = recruiterProfileData.aadharCardFront ? removeOriginFromUrl(recruiterProfileData.aadharCardFront) : null;
      recruiterProfileData.aadharCardBack = recruiterProfileData.aadharCardBack ? removeOriginFromUrl(recruiterProfileData.aadharCardBack) : null;

      await RecruiterProfileModel.update(recruiterProfileData, { where: { userId: id }, returning: true });
    }
    if (!isEmpty(recruiterBusinessData)) {
      recruiterBusinessData.updatedBy = user.id;
      await RecruiterBusinessModel.update(recruiterBusinessData, { where: { userId: id }, returning: true });
    }

    const response = {
      status: SUCCESS,
      message: getMessage('RECRUITER_UPDATED', localeService),
    };

    return response;
  } catch (error) {
    recruiterLogger(`Error updating recruiter details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateRecruiterDetails;
