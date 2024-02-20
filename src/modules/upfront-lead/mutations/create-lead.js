/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
const { size } = require('lodash');
const moment = require('moment');
const Sequelize = require('sequelize');

const {
  UPFRONT, DEFAULT_TIMEZONE, EVENT_NAME_LIMIT,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const checkExistingCalenderDatesForEvent = require('../../event/functions/check-existing-calender-dates-for-event');
const upfrontLeadLogger = require('../upfront-lead-logger');

const createUpfrontLead = async (_, args, ctx) => {
  let transaction;
  try {
    const { req, localeService } = ctx;
    const { user } = req;
    const { data = {} } = args;
    const { timeZone = DEFAULT_TIMEZONE } = data;
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      Event: EventModel, EventTiming: EventTimingModel, FreelancerCalender: FreelancerCalenderModel,
      UpfrontCategoryRequirement: UpfrontCategoryRequirementModel,
    } = ctx.models;

    const {
      name, location, startDate, totalBudget, note, requiredFreelancer, recruiterId, endDate,
    } = data;
    const { timings } = data;

    if (size(name) > EVENT_NAME_LIMIT) {
      throw new CustomApolloError(getMessage('EVENT_NAME_CHARACTER_LIMIT_EXCEEDED', localeService));
    }
    // ADDED CHECK FOR EXISTING CUSTOM EVENT FOR SELECTED DATES
    const existingCustomEvent = await checkExistingCalenderDatesForEvent(recruiterId, startDate, endDate);
    if (existingCustomEvent) {
      throw new CustomApolloError(getMessage('EVENT_ALREADY_EXISTS', localeService));
    }
    const localStartOfDay = moment().tz(timeZone).startOf('day').format(); // START OF LOCAL DAY TIMEZONE (DEFAULT ASIA/KOLKATA)
    const localEventStartDate = moment(startDate).tz(timeZone).format(); // START DATE OF LOCAL TIMEZONE (DEFAULT ASIA/KOLKATA)
    const localEventEndDate = moment(endDate).tz(timeZone).format(); // END DATE OF LOCAL TIMEZONE (DEFAULT ASIA/KOLKATA)

    if (moment(localEventStartDate).isBefore(localStartOfDay) || moment(localEventEndDate).isBefore(localStartOfDay)) {
      throw new CustomApolloError(getMessage('DATE_CANNOT_BE_BEFORE_CURRENT_TIME', localeService));
    }

    const upfrontLeadObj = {
      createdBy: user.id,
      recruiterId,
      name,
      startDate,
      endDate,
      location,
      leadType: UPFRONT,
      totalBudget,
      note,
    };
    const [requiredFreelancerDetails, sumOfRequiredFreelancer] = await getRequiredFreelancerDetailsForCreateLead(requiredFreelancer);

    if (Number(sumOfRequiredFreelancer) !== Number(totalBudget)) {
      throw new CustomApolloError(getMessage('TOTAL_BUDGET_IS_NOT_VALID', localeService));
    }

    for (const timing of timings) {
      // validate date
      const { startDate: timingStartDate } = timing;
      const validateStartDate = moment(timingStartDate).isBetween(upfrontLeadObj.startDate, upfrontLeadObj.endDate, null, '[]');

      if (!validateStartDate) {
        throw new CustomApolloError(getMessage('INVALID_TIMINGS', localeService));
      }
    }

    // Set recruiter calender
    const recruiterCalender = {
      userId: recruiterId,
      startDate: upfrontLeadObj.startDate,
      endDate: upfrontLeadObj.endDate,
    };

    upfrontLeadObj.freelancerCalender = recruiterCalender;

    upfrontLeadObj.categories = requiredFreelancerDetails;
    upfrontLeadObj.timings = timings;

    await EventModel.create(upfrontLeadObj, {
      include: [
        {
          model: UpfrontCategoryRequirementModel,
          as: 'categories',
        },
        {
          model: EventTimingModel,
          as: 'timings',
        },
        {
          model: FreelancerCalenderModel,
          as: 'freelancerCalender',
        },
      ],
      transaction,
    });

    await transaction.commit();

    const response = {
      message: getMessage('UPFRONT_LEAD_CREATED_SUCCESSFULLY', localeService),
      status: 'SUCCESS',
    };

    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    upfrontLeadLogger(`Error from upfront lead : ${error}`, ctx, 'error');
    throw error;
  }
};

const getRequiredFreelancerDetailsForCreateLead = async freelancers => {
  const categoriesData = [];
  let sumOfRequiredFreelancer = 0;

  freelancers.forEach(category => {
    if (category.type) {
      const eventCategories = {
        categoryType: category.type,
        count: category.count,
        pricePerDay: category.pricePerDay,
      };
      sumOfRequiredFreelancer += eventCategories.pricePerDay * eventCategories.count;
      categoriesData.push(eventCategories);
    }
  });
  return [categoriesData, sumOfRequiredFreelancer];
};
module.exports = createUpfrontLead;
