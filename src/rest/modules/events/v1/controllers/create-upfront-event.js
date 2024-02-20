/* eslint-disable max-len */
/* eslint-disable max-lines */
/* eslint-disable prefer-const */
/* eslint-disable no-param-reassign */
const { validationResult } = require('express-validator');
const { omit } = require('lodash');

const {
  APPROVED,
} = require('../../../../../constants/service-constants');
const checkExistingCalenderDatesForEvent = require('../../../../../modules/event/functions/check-existing-calender-dates-for-event');

const {
  User: UserModel,
  Event: EventModel,
  UserProfile: UserProfileModel,
  UpfrontCategoryRequirement: UpfrontCategoryRequirementModel,
  FreelancerCalender: FreelancerCalenderModel,
  sequelize,
  Sequelize,
} = require('../../../../../sequelize-client');
const sendEmailForUpFrontEnquirySubmitted = require('../../../../../shared-lib/emails/event/send-email-for-upfront-enquiry-submitted');
const createNotificationForUpfrontLeadSubmissionToRecruiter = require('../../../../../shared-lib/notifications/events/create-notification-for-upfront-lead-submission-to-recruiter');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const { ApiError } = require('../../../../services/custom-api-error');
const getCategoriesService = require('../../../../services/get-categories-service');
const eventLogger = require('../../event-logger');

const createUpfrontEvent = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message
      throw new ApiError(extractedError, 422);
    }
    const { user, localeService } = req;
    const recruiterInstance = await UserModel.findByPk(user.id,
      {
        attributes: ['id', 'verificationStatus'],
        include: [
          {
            model: UserProfileModel,
            as: 'profile',
            attributes: ['typeKey'],
          },
        ],
      });

    if (!recruiterInstance || recruiterInstance.verificationStatus !== APPROVED) {
      throw new ApiError('PROFILE_NOT_VERIFIED', 401);
    }
    const { typeKey: recruiterType } = recruiterInstance.profile;
    let {
      name,
      location,
      startDate,
      endDate,
      totalBudget,
      note,
      categories,
    } = req.body;

    // ADDED CHECK FOR EXISTING CUSTOM EVENT FOR SELECTED DATES
    const existingCustomEvent = await checkExistingCalenderDatesForEvent(user.id, startDate, endDate);
    if (existingCustomEvent) {
      throw new ApiError(getMessage('EVENT_ALREADY_EXISTS', localeService));
    }
    const upfrontBooking = {
      createdBy: user.id,
      recruiterId: user.id,
      name,
      startDate,
      endDate,
      location,
      leadType: 'UPFRONT',
      totalBudget,
      note,
    };

    let categoryIds = await getCategoriesService();
    categoryIds = categoryIds.map(s => s.id);

    upfrontBooking.categories = [];
    categories.forEach(category => {
      if (!categoryIds.includes(category.categoryId)) {
        return;
      }
      const eventCategories = {
        categoryType: category.categoryId,
        count: category.count,
        pricePerDay: category.pricePerDay,
      };
      upfrontBooking.categories.push(eventCategories);
    });

    // set recruiter calender
    const freelancerCalender = {
      userId: user.id,
      startDate: upfrontBooking.startDate,
      endDate: upfrontBooking.endDate,
    };

    upfrontBooking.freelancerCalender = freelancerCalender;
    // Validate the category IDs
    if (!upfrontBooking.categories.length) {
      throw new ApiError('INVALID_CATEGORY', 406);
    }

    const event = await EventModel.create(upfrontBooking, {
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
    await transaction.commit();

    sendEmailForUpFrontEnquirySubmitted(event.id);

    // Remove unnecessary attributes
    let response = JSON.parse(JSON.stringify(event));
    response = omit(response, ['createdAt', 'updatedAt', 'deletedAt']);
    /* eslint-disable no-restricted-syntax */
    for (const eventCategory of response.categories) {
      delete eventCategory.deletedAt;
      delete eventCategory.updatedAt;
      delete eventCategory.createdAt;
    }
    if (event) {
      createNotificationForUpfrontLeadSubmissionToRecruiter(user.id, event.id, recruiterType, localeService);
    }

    return sendSuccessResponse(res, 'SUCCESS', 201, response);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    eventLogger(`Error from creating-upfront-leads: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = createUpfrontEvent;
