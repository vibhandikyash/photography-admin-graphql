/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { pick } = require('lodash');
const { Op } = require('sequelize');

const { SUCCESS } = require('../../../constants/service-constants');

const { sequelize, Sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const FREELANCER_USER = ['fullName', 'userName', 'email', 'contactNo', 'countryCode', 'verificationStatus', 'isActive'];
const FREELANCER_PROFILE = ['bio', 'profilePhoto', 'coverPhoto', 'aadharCardFront', 'aadharCardBack', 'typeKey', 'isFeatured'];
const FREELANCER_BUSINESS = [
  'projectsComplete',
  'tagLine',
  'pricePerDay',
  'primaryLocation',
  'secondaryLocation',
  'accomplishments',
  'equipmentList',
  'instagramLink',
  'categoryId',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'country',
  'zipCode',
];
const FREELANCER_BADGE = ['badgeIds'];

const createFreelancer = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      models: {
        User: UserModel,
        UserBusiness: FreelancerBusinessModel,
        UserProfile: FreelancerProfileModel,
        UserBadge: FreelancerBadgeModel,
      },
      localeService,
    } = ctx;

    const { user } = ctx.req;
    const { data } = args;
    const existingData = await UserModel.findOne({
      where: {
        accountDeletedAt: null,
        [Op.or]: [
          { email: { [Sequelize.Op.iLike]: data.email } },
          { contactNo: data.contactNo },
          { userName: data.userName },
        ],
      },
    });
    if (existingData) {
      const { email: existingEmail, contactNo: existingContactNo, userName: existingUserName } = existingData;
      const { email, contactNo, userName } = data;
      if (email === existingEmail) {
        throw new CustomApolloError(getMessage('FREELANCER_EMAIL_EXISTS', localeService));
      }
      if (contactNo === existingContactNo) {
        throw new CustomApolloError(getMessage('CONTACT_ALREADY_EXISTS', localeService));
      }
      if (userName === existingUserName) {
        throw new CustomApolloError(getMessage('USERNAME_ALREADY_EXISTS', localeService));
      }
    }

    const freelancerUserData = pick(data, FREELANCER_USER);
    const freelancerProfileData = { ...pick(data, FREELANCER_PROFILE), createdBy: user.id };
    const freelancerBusinessData = { ...pick(data, FREELANCER_BUSINESS), createdBy: user.id };
    const freelancerUserBadge = pick(data, FREELANCER_BADGE);
    freelancerUserData.role = 'FREELANCER';
    freelancerUserData.profile = freelancerProfileData;
    freelancerUserData.business = freelancerBusinessData;

    const { badgeIds } = freelancerUserBadge;

    if (badgeIds) {
      freelancerUserData.badge = [];
      for (const badgeId of badgeIds) {
        const freelancerBadges = {};
        freelancerBadges.badgeId = badgeId;
        freelancerBadges.assignedBy = user.id;
        freelancerUserData.badge.push(freelancerBadges);
      }
    }

    const freelancer = await UserModel.create(freelancerUserData, {
      include: [
        {
          model: FreelancerProfileModel,
          as: 'profile',
        },
        {
          model: FreelancerBusinessModel,
          as: 'business',
        },
        {
          model: FreelancerBadgeModel,
          as: 'badge',
        },
      ],
      transaction,
    });

    await transaction.commit();

    const response = {
      status: SUCCESS,
      message: getMessage('FREELANCER_CREATED', localeService),
      id: freelancer.id,
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    freelancerLogger(`Error creating freelancer: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createFreelancer;
