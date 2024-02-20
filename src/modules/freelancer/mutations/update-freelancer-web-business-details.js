const { Op } = require('sequelize');

const { SUCCESS, WEDLANCER_ASSURED, APPROVED } = require('../../../constants/service-constants');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const removeOriginFromUrl = require('../../../utils/remove-origin-from-url');
const freelancerLogger = require('../freelancer-logger');

const updateFreelancerWebBusinessDetails = async (_, args, ctx) => {
  try {
    const {
      models: {
        UserBusiness: UserBusinessModel, UserProfile: UserProfileModel, Category: CategoryModel, UserCollection: UserCollectionModel,
        UserCollectionAsset: UserCollectionAssetsModel,
      }, req: { user: { id: userId, verificationStatus } }, localeService,
    } = ctx;
    const { data } = args;

    const { secondaryLocation, categoryId } = data;
    let { aadharCardBack, aadharCardFront } = data;
    if (categoryId) {
      const existingCategory = await CategoryModel.findByPk(categoryId);
      if (!existingCategory) {
        throw new CustomApolloError(getMessage('INVALID_CATEGORY', localeService));
      }
      const existingUserCategory = await UserBusinessModel.findOne({ where: { userId }, attributes: ['categoryId'] });
      if (categoryId !== existingUserCategory.categoryId) {
        await UserCollectionAssetsModel.destroy({ where: { userId } });
        await UserCollectionModel.destroy({ where: { userId } });
      }
    }
    if (secondaryLocation) {
      const user = await UserProfileModel.findOne({ where: { userId }, attributes: ['typeKey'] });
      const { typeKey } = user;
      if (typeKey !== WEDLANCER_ASSURED) {
        throw new CustomApolloError(getMessage('ONLY_WEDLANCER_ASSURED_ARE_ALLOWED_FOR_SECONDARY_LOCATION', localeService));
      }
    }

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
    data.updatedBy = userId;
    const profileData = { aadharCardFront, aadharCardBack, updatedBy: userId };

    await UserBusinessModel.update(data, { where: { userId } });
    await UserProfileModel.update(profileData, { where: { userId } });

    const response = { status: SUCCESS, message: getMessage('UPDATED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    freelancerLogger(`Error updating freelancer web business details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateFreelancerWebBusinessDetails;
