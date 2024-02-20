const { SUCCESS } = require('../../../constants/service-constants');

const { getMessage } = require('../../../utils/messages');
const removeOriginFromUrl = require('../../../utils/remove-origin-from-url');
const recruiterLogger = require('../recruiter-logger');

const updateRecruiterWebDetails = async (_, args, ctx) => {
  try {
    const { models: { UserProfile: UserProfileModel }, req: { user: { id: userId } }, localeService } = ctx;
    let { data: { coverPhoto, profilePhoto } } = args;

    profilePhoto = profilePhoto ? removeOriginFromUrl(profilePhoto) : null;
    coverPhoto = coverPhoto ? removeOriginFromUrl(coverPhoto) : null;

    const data = { profilePhoto, coverPhoto, updatedBy: userId };
    await UserProfileModel.update(data, { where: { userId } });

    const response = { status: SUCCESS, message: getMessage('UPDATED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    recruiterLogger(`Error updating recruiter web details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateRecruiterWebDetails;
