/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const {
  pick,
  isEmpty,
  difference,
  map,
  get,
} = require('lodash');
const { Op } = require('sequelize');

const {
  SUCCESS, APPROVED, REJECTED, FREELANCER, ONGOING, UPCOMING,
} = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const sendEmailForFreelancerApprovedProfile = require('../../../shared-lib/emails/profile/send-email-for-freelancer-approved-profile');
const sendEmailForProfileRejection = require('../../../shared-lib/emails/profile/send-email-for-profile-rejection');

const { CustomApolloError } = require('../../../shared-lib/error-handler');
const createNotificationForUserProfileApproval = require('../../../shared-lib/notifications/users/create-notification-for-user-profile-approval');
const createNotificationForUserProfileRejection = require('../../../shared-lib/notifications/users/create-notification-for-user-profile-rejection');
const { getMessage } = require('../../../utils/messages');
const removeOriginFromUrl = require('../../../utils/remove-origin-from-url');
const freelancerLogger = require('../freelancer-logger');

const FREELANCER_USER = ['fullName', 'userName', 'email', 'contactNo', 'countryCode', 'verificationStatus', 'isActive'];
const FREELANCER_PROFILE = ['bio', 'profilePhoto', 'coverPhoto', 'aadharCardFront', 'aadharCardBack', 'typeKey', 'isFeatured'];
const FREELANCER_BUSINESS = ['projectsComplete', 'tagLine', 'pricePerDay', 'primaryLocation', 'secondaryLocation', 'accomplishments', 'equipmentList',
  'instagramLink', 'categoryId', 'addressLine1', 'addressLine2', 'city', 'state', 'country', 'zipCode',
];
const FREELANCER_BADGE = ['badgeIds'];

const updateFreelancerDetails = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      models: {
        User: UserModel, UserCollection: FreelancerCollectionModel, UserCollectionAsset: FreelancerCollectionAssetsModel,
        UserProfile: FreelancerProfileModel, UserBusiness: FreelancerBusinessModel, UserBadge: FreelancerBadgeModel,
        EventFreelancer: EventFreelancerModel, Event: EventModel,
      }, req: { user },
      localeService,
    } = ctx;
    const { data } = args;
    const { id } = args.where;

    const freelancerInstance = await UserModel.findByPk(id);

    if (!freelancerInstance || freelancerInstance.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }

    const existingCategory = await FreelancerBusinessModel.findOne({ where: { userId: id }, attributes: ['categoryId'] });

    const freelancerUserData = pick(data, FREELANCER_USER);
    const freelancerProfileData = pick(data, FREELANCER_PROFILE);
    const freelancerBusinessData = pick(data, FREELANCER_BUSINESS);
    const freelancerUserBadge = pick(data, FREELANCER_BADGE);

    if (!isEmpty(freelancerUserData)) {
      const { contactNo = null, userName = null, email = null } = freelancerUserData;
      const existingData = await UserModel.findOne({
        where: { id: { [Op.ne]: id }, accountDeletedAt: null, [Op.or]: [{ contactNo }, { userName }, { email }] },
      });
      if (existingData) {
        const { contactNo: existingContactNo, userName: existingUserName, email: existingEmail } = existingData;
        if (!isEmpty(email) && email === existingEmail) {
          throw new CustomApolloError(getMessage('EMAIL_ALREADY_EXISTS', localeService));
        } else if (!isEmpty(contactNo) && contactNo === existingContactNo) {
          throw new CustomApolloError(getMessage('CONTACT_ALREADY_EXISTS', localeService));
        } else if (!isEmpty(userName) && userName === existingUserName) {
          throw new CustomApolloError(getMessage('USERNAME_ALREADY_EXISTS', localeService));
        }
      }

      // CHECK EXISTING VERIFICATION STATUS
      const existingStatus = await UserModel.findByPk(id, { attributes: ['verificationStatus'] });
      const { verificationStatus: existingVerificationStatus } = existingStatus;

      if (existingVerificationStatus !== freelancerUserData.verificationStatus) {
        if (freelancerUserData.verificationStatus === APPROVED) {
          createNotificationForUserProfileApproval(user.id, id, FREELANCER, localeService); // SEND NOTIFICATION
          sendEmailForFreelancerApprovedProfile(id); // SEND EMAIL
        } else if (freelancerUserData.verificationStatus === REJECTED) {
          createNotificationForUserProfileRejection(user.id, id, localeService); // SEND NOTIFICATION
          sendEmailForProfileRejection(id); // SEND EMAIL
        }
      }
      await UserModel.update(freelancerUserData, { where: { id }, returning: true });
    }
    if (!isEmpty(freelancerProfileData)) {
      const typeKey = get(freelancerProfileData, 'typeKey');
      const freelancerProfile = await FreelancerProfileModel.findOne({ where: { userId: id }, attributes: ['typeKey'] });
      const { typeKey: existingTypeKey } = freelancerProfile;
      if (typeKey !== existingTypeKey) {
        const events = await EventModel.findAll({
          where: { status: [ONGOING, UPCOMING] },
          include: {
            model: EventFreelancerModel,
            as: 'freelancers',
            where: { isAssigned: true, userId: id },
            required: true,
          },
        });
        if (events.length) {
          throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_UPDATE_FREELANCER_TYPE', localeService));
        }
      }

      freelancerProfileData.updatedBy = user.id;
      freelancerProfileData.profilePhoto = freelancerProfileData.profilePhoto
        ? removeOriginFromUrl(freelancerProfileData.profilePhoto) : null;
      freelancerProfileData.coverPhoto = freelancerProfileData.coverPhoto ? removeOriginFromUrl(freelancerProfileData.coverPhoto) : null;
      freelancerProfileData.aadharCardFront = freelancerProfileData.aadharCardFront
        ? removeOriginFromUrl(freelancerProfileData.aadharCardFront) : null;
      freelancerProfileData.aadharCardBack = freelancerProfileData.aadharCardBack ? removeOriginFromUrl(freelancerProfileData.aadharCardBack) : null;
      await FreelancerProfileModel.update(freelancerProfileData, { where: { userId: id }, returning: true });
    }
    if (!isEmpty(freelancerBusinessData)) {
      freelancerBusinessData.updatedBy = user.id;
      if (freelancerBusinessData.categoryId !== existingCategory.categoryId) {
        await FreelancerCollectionAssetsModel.destroy({ where: { userId: id } }, { transaction });
        await FreelancerCollectionModel.destroy({ where: { userId: id } }, { transaction });
      }
      await FreelancerBusinessModel.update(freelancerBusinessData, { where: { userId: id }, returning: true });
    }

    if (!isEmpty(freelancerUserBadge)) {
      const { badgeIds } = freelancerUserBadge;
      const existingBadgesInstance = await FreelancerBadgeModel.findAll({ where: { userId: id } });
      const existingBadges = map(existingBadgesInstance, 'badgeId');
      const badgesToAdd = difference(badgeIds, existingBadges);
      const badgesToRemove = difference(existingBadges, badgeIds);

      if (badgesToAdd.length) {
        for (const badge of badgesToAdd) {
          const badgeData = { userId: id, badgeId: badge, assignedBy: user.id };
          await FreelancerBadgeModel.create(badgeData);
        }
      }
      if (badgesToRemove.length) {
        await FreelancerBadgeModel.destroy({ where: { userId: id, badgeId: { [Sequelize.Op.in]: badgesToRemove } } });
      }
    }

    await transaction.commit();

    const response = { status: SUCCESS, message: getMessage('FREELANCER_UPDATED', localeService) };

    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    freelancerLogger(`Error updating freelancer details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateFreelancerDetails;
