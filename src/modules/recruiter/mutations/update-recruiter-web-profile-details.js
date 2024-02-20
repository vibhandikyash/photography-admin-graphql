const { Op } = require('sequelize');

const { SUCCESS, APPROVED } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');

const { getMessage } = require('../../../utils/messages');
const removeOriginFromUrl = require('../../../utils/remove-origin-from-url');
const recruiterLogger = require('../recruiter-logger');

const updateRecruiterWebProfileDetails = async (_, args, ctx) => {
  try {
    const {
      models: { UserProfile: UserProfileModel, User: UserModel, UserBusiness: UserBusinessModel },
      req: { user: { id: userId, verificationStatus } }, localeService,
    } = ctx;
    const {
      data: {
        fullName, companyName, email, contactNo, addressLine1, addressLine2, country, city, state, zipCode,
      },
    } = args;
    let { data: { aadharCardBack, aadharCardFront } } = args;

    aadharCardFront = aadharCardFront ? removeOriginFromUrl(aadharCardFront) : null;
    aadharCardBack = aadharCardBack ? removeOriginFromUrl(aadharCardBack) : null;

    if (aadharCardBack || aadharCardFront) {
      const existingData = await UserProfileModel.findOne({
        where: {
          [Op.or]: [{ aadharCardBack: { [Op.ne]: aadharCardBack } }, { aadharCardFront: { [Op.ne]: aadharCardFront } }],
          userId,
        },
      });
      if (existingData && verificationStatus === APPROVED) {
        throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_UPDATE_AADHAR_AFTER_APPROVAL', localeService));
      }
    }
    const recruiterData = {
      fullName, email, contactNo, updatedBy: userId,
    };
    const businessData = {
      addressLine1, companyName, addressLine2, country, city, state, zipCode, updatedBy: userId,
    };
    const profileData = { aadharCardFront, aadharCardBack, updatedBy: userId };

    await UserModel.update(recruiterData, { where: { id: userId } });
    await UserBusinessModel.update(businessData, { where: { userId } });
    await UserProfileModel.update(profileData, { where: { userId } });

    const response = { status: SUCCESS, message: getMessage('UPDATED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    recruiterLogger(`Error updating recruiter web profile details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateRecruiterWebProfileDetails;
