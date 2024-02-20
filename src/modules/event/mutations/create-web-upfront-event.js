/* eslint-disable no-restricted-syntax */
const { isEmpty } = require('lodash');

const { SUCCESS, APPROVED, UPFRONT } = require('../../../constants/service-constants');

const { sequelize, Sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');
const checkExistingCalenderDatesForEvent = require('../functions/check-existing-calender-dates-for-event');

const createWebUpfrontEvent = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      req: { user: { id: userId, verificationStatus } },
      models: {
        Event: EventModel, UserProfile: UserProfileModel, UpfrontCategoryRequirement: UpfrontCategoryRequirementModel,
        FreelancerCalender: FreelancerCalenderModel,
      }, localeService,
    } = ctx;
    const {
      data: {
        name, startDate, endDate, location, categories, instagramLink, note, totalBudget,
      } = {},
    } = args;

    // ADDED CHECK FOR EXISTING CUSTOM EVENT FOR SELECTED DATES
    const existingCustomEvent = await checkExistingCalenderDatesForEvent(userId, startDate, endDate);
    if (existingCustomEvent) {
      throw new CustomApolloError(getMessage('EVENT_ALREADY_EXISTS', localeService));
    }
    const upfrontEvent = {
      name, startDate, endDate, location, note, recruiterId: userId, createdBy: userId, leadType: UPFRONT, totalBudget,
    };

    if (verificationStatus !== APPROVED) {
      throw new CustomApolloError(getMessage('PROFILE_NOT_VERIFIED', localeService));
    }
    upfrontEvent.categories = [];
    for (const category of categories) {
      const { categoryType, count, pricePerDay } = category;
      const eventCategories = { categoryType, count, pricePerDay };
      upfrontEvent.categories.push(eventCategories);
    }
    // SET RECRUITER CALENDER
    upfrontEvent.freelancerCalender = { userId, startDate, endDate };

    await EventModel.create(upfrontEvent, {
      include: [
        {
          model: UpfrontCategoryRequirementModel,
          as: 'categories',
        },
        {
          model: FreelancerCalenderModel,
          as: 'freelancerCalender',
        },
      ],
      transaction,
    });
    if (!isEmpty(instagramLink)) {
      await UserProfileModel.update({ instagramLink }, { where: { userId } });
    }
    await transaction.commit();
    const response = { status: SUCCESS, message: getMessage('UPFRONT_LEAD_CREATED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventsLogger(`Error create web upfront event: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = createWebUpfrontEvent;
