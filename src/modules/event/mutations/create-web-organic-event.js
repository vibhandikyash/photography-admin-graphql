/* eslint-disable max-len */
const { get } = require('lodash');

const {
  SUCCESS, APPROVED, ORGANIC, NON_PAID, WEDLANCER_ASSURED,
} = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const sendEmailForOrganicEnquirySubmittedToFreelancer = require('../../../shared-lib/emails/event/send-email-for-organic-enquiry-submitted-to-freelancer');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');
const checkExistingCalenderDatesForEvent = require('../functions/check-existing-calender-dates-for-event');

const createWebOrganicEvent = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      req: { user: { id: userId, verificationStatus } },
      models: {
        User: UserModel, Event: EventModel, FreelancerCalender: FreelancerCalenderModel,
        EventFreelancer: EventFreelancerModel, UserBusiness: UserBusinessModel, UserProfile: UserProfileModel,
      }, localeService,
    } = ctx;
    const {
      data: {
        name, startDate, endDate, location, note,
      } = {}, where: { freelancerId = null } = {},
    } = args;

    if (verificationStatus !== APPROVED) {
      throw new CustomApolloError(getMessage('PROFILE_NOT_VERIFIED', localeService));
    }
    // ADDED CHECK FOR EXISTING CUSTOM EVENT FOR SELECTED DATES
    const existingCustomEvent = await checkExistingCalenderDatesForEvent(userId, startDate, endDate);
    if (existingCustomEvent) {
      throw new CustomApolloError(getMessage('EVENT_ALREADY_EXISTS', localeService));
    }
    const freelancer = await UserModel.findByPk(freelancerId, {
      include: [
        { model: UserBusinessModel, as: 'business', attributes: ['pricePerDay'] },
        { model: UserProfileModel, as: 'profile', attributes: ['typeKey'] }],
    });
    if (!freelancer || freelancer.accountDeletedAt !== null) {
      throw new CustomApolloError(getMessage('FREELANCER_NOT_FOUND', localeService));
    }

    const recruiter = await UserProfileModel.findOne({ where: { userId }, attributes: ['typeKey'] });

    const freelancerTypeKey = get(freelancer, 'profile.typeKey');
    const recruiterTypeKey = get(recruiter, 'typeKey');

    if (recruiterTypeKey === NON_PAID && freelancerTypeKey === WEDLANCER_ASSURED) {
      throw new CustomApolloError(getMessage('NOT_ALLOWED_TO_HIRE_WEDLANCER_ASSURED_BY_NON_PAID_RECRUITER', localeService));
    }

    let pricePerDay;
    if (freelancer.business) {
      pricePerDay = freelancer?.business?.pricePerDay;
    }
    const organicEvent = {
      name, startDate, endDate, location, note, recruiterId: userId, createdBy: userId, leadType: ORGANIC, totalBudget: pricePerDay,
    };
    organicEvent.freelancers = { userId: freelancerId, isRequested: true };
    organicEvent.freelancerCalender = { userId, startDate, endDate };

    const event = await EventModel.create(organicEvent, {
      include: [
        {
          model: EventFreelancerModel,
          as: 'freelancers',
        },
        {
          model: FreelancerCalenderModel,
          as: 'freelancerCalender',
        },
      ],
      transaction,
    });

    await transaction.commit();

    // SEND EMAIL TO THE FREELANCER FOR ORGANIC ENQUIRY
    if (event && freelancerTypeKey !== WEDLANCER_ASSURED) {
      sendEmailForOrganicEnquirySubmittedToFreelancer(event.id, freelancerId);
    }
    const response = { status: SUCCESS, message: getMessage('ORGANIC_LEAD_CREATED', localeService) };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventsLogger(`Error create web organic event: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createWebOrganicEvent;
