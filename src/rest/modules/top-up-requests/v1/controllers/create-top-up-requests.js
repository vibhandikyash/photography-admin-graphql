/* eslint-disable max-len */
const { validationResult } = require('express-validator');
const { map } = require('lodash');

const {
  PENDING, FREELANCER,
} = require('../../../../../constants/service-constants');

const { TopUpRequest: TopUpRequestModel, Event: EventModel, EventFreelancer: EventFreelancerModel } = require('../../../../../sequelize-client');
const createNotificationForPaymentConfirmationFromFreelancer = require('../../../../../shared-lib/notifications/top-up-requests/create-notification-for-payment-confirmation-from-freelancer');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const { ApiError } = require('../../../../services/custom-api-error');
const {
  OK, NOT_FOUND, VALIDATION_FAILED, FORBIDDEN,
} = require('../../../../services/http-status-codes');
const isDeletedUser = require('../../../../services/users/is-deleted-user');

const topUpRequestsLogger = require('../../top-up-requests-logger');

const topUpRequests = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, VALIDATION_FAILED);
    }

    const {
      user, body: {
        amount, modeOfPayment, freelancerId, eventId,
      }, localeService,
    } = req;

    const { isDeleted, userInstance } = await isDeletedUser(freelancerId);

    if (isDeleted || userInstance.role !== FREELANCER) {
      throw new ApiError(getMessage('FREELANCER_NOT_FOUND'), NOT_FOUND);
    }

    const eventInstance = await EventModel.findByPk(eventId,
      {
        attributes: ['id', 'recruiterId'],
        include: {
          model: EventFreelancerModel,
          as: 'freelancers',
          where: { isAssigned: true },
          attributes: ['userId'],
          required: false,
        },
      });

    if (!eventInstance || eventInstance.recruiterId !== user.id) {
      throw new ApiError('EVENT_NOT_FOUND', NOT_FOUND);
    }
    const eventFreelancerIds = map(eventInstance.freelancers, 'userId');
    if (!eventFreelancerIds.includes(freelancerId)) {
      throw new ApiError(getMessage('NOT_ALLOWED_TO_SEND_REQUEST'), FORBIDDEN);
    }

    const data = {
      eventId,
      senderId: user.id,
      amount,
      receiverId: freelancerId,
      modeOfPayment,
      status: PENDING,
    };
    const topUpRequestData = await TopUpRequestModel.create(data);

    if (topUpRequestData) {
      createNotificationForPaymentConfirmationFromFreelancer(user, freelancerId, topUpRequestData, localeService);
    }

    return sendSuccessResponse(res, 'TOP_REQUEST_CREATED_SUCCESSFULLY', OK);
  } catch (error) {
    topUpRequestsLogger(`Error from sending top up requests ${error}`, res, 'error');
    return next(error);
  }
};

module.exports = topUpRequests;
