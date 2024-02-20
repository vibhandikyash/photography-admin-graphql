const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const recruiterLogger = require('../recruiter-logger');

const getRecruiterWebDetails = async (_, args, ctx) => {
  try {
    const { models: { User: UserModel, UserProfile: UserProfileModel }, req: { user: { id: userId } }, localeService } = ctx;

    const recruiter = await UserModel.findByPk(userId,
      {
        attributes: ['id', 'fullName', 'verificationStatus', 'accountDeletedAt'],
        include: [{
          model: UserProfileModel,
          as: 'profile',
          attributes: ['coverPhoto', 'profilePhoto'],
        }],
      });

    if (!recruiter || recruiter.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('RECRUITER_NOT_FOUND', localeService));
    }

    return recruiter;
  } catch (error) {
    recruiterLogger(`Error from getting recruiter web details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getRecruiterWebDetails;
