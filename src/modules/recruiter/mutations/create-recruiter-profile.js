const { SUCCESS } = require('../../../constants/service-constants');
const { getMessage } = require('../../../utils/messages');
const recruiterLogger = require('../recruiter-logger');

const createRecruiterProfile = async (_, args, ctx) => {
  try {
    const {
      models: {
        UserBusiness: UserBusinessModel,
        UserProfile: UserProfileModel,
      },
      req: { user: { id: userId } },
      localeService,
    } = ctx;

    const {
      data: {
        aadharCardFront = null, aadharCardBack = null, city = null, state = null,
        country = null, companyName = null, addressLine1 = null, addressLine2 = null, zipCode = null,
      } = {},
    } = args;

    await Promise.all([
      UserBusinessModel.update({
        city, state, country, companyName, addressLine1, addressLine2, zipCode,
      }, { where: { userId } }),
      UserProfileModel.update({ aadharCardFront, aadharCardBack }, { where: { userId } }),
    ]);

    const response = {
      status: SUCCESS,
      message: getMessage('RECRUITER_PROFILE_CREATED', localeService),
    };

    return response;
  } catch (error) {
    recruiterLogger(`Error creating recruiter profile: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createRecruiterProfile;

