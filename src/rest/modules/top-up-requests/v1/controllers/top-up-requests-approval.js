/* eslint-disable max-len */
const { validationResult } = require('express-validator');
const { get } = require('lodash');
const { v4: UUID } = require('uuid');

const {
  TOP_UP, COMPLETED, APPROVED, REJECTED, NOTIFICATION_TYPES: { TOP_UP_REQUEST_RECEIVED }, NOTIFICATION_REF_TYPES: { TOP_UP_REQUEST },
} = require('../../../../../constants/service-constants');

const {
  Transaction: TransactionModel, TopUpRequest: TopUpRequestModel, UserBusiness: UserBusinessModel, User: UserModel, Notification: NotificationModel,
  sequelize,
  Sequelize,
} = require('../../../../../sequelize-client');
const sendEmailForTopUpRequestApproved = require('../../../../../shared-lib/emails/top-up/send-email-for-top-up-request-approve');
const createNotificationForSuccessfulPaymentToFreelancer = require('../../../../../shared-lib/notifications/top-up-requests/create-notification-for-successful-payment-to-freelancer');
const createNotificationForSuccessfulPaymentToRecruiter = require('../../../../../shared-lib/notifications/top-up-requests/create-notification-for-successful-payment-to-recruiter');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { getMessage } = require('../../../../../utils/messages');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const { OK, NOT_FOUND, INVALID_INPUT } = require('../../../../services/http-status-codes');
const isDeletedUser = require('../../../../services/users/is-deleted-user');
const topUpRequestsLogger = require('../../top-up-requests-logger');

const topUpRequestsApproval = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message

      throw new ApiError(extractedError, 422);
    }
    const {
      params: { id: topUpRequestId }, body: { status }, user: { id: userId }, localeService,
    } = req;

    if (!validateUUID(topUpRequestId)) throw new ApiError('INVALID_INPUT', INVALID_INPUT);

    const existingRequest = await TopUpRequestModel.findByPk(topUpRequestId, {
      attributes: ['id', 'senderId', 'receiverId', 'amount', 'modeOfPayment', 'eventId'],
    });

    if (!existingRequest) {
      throw new ApiError(getMessage('TOP_UP_REQUEST_NOT_FOUND'), NOT_FOUND);
    }

    // check deleted user
    const { isDeleted } = await isDeletedUser(existingRequest.senderId);
    if (isDeleted) {
      throw new ApiError(getMessage('USER_NOT_FOUND'), NOT_FOUND);
    }

    const userBusiness = await UserBusinessModel.findOne(
      {
        where: { userId: existingRequest.senderId },
        attributes: ['id', 'userId', 'totalBalance'],
        include: {
          model: UserModel,
          as: 'userBusiness',
          attributes: ['fullName'],
        },
      },
    );

    const senderFullName = get(userBusiness, 'userBusiness.fullName');

    if (status === APPROVED || status === REJECTED) {
      let message;
      await existingRequest.update({ status }, { transaction });

      if (status === APPROVED) {
        const totalBalance = userBusiness.totalBalance + existingRequest.amount;
        const data = {
          userId: existingRequest.senderId,
          eventId: existingRequest.eventId,
          amount: existingRequest.amount,
          transactionType: TOP_UP,
          transactionSubType: TOP_UP,
          modeOfTransaction: existingRequest.modeOfPayment,
          transactionStatus: COMPLETED,
          closingBalance: totalBalance,
          freelancerId: existingRequest.receiverId,
          metaData: { topUpRequestId },
          groupId: UUID(),
        };
        await TransactionModel.create(data, { transaction });
        await UserBusinessModel.increment('totalBalance', {
          by: existingRequest.amount, where: { userId: existingRequest.senderId },
        }, { transaction });

        // NOTIFICATION TO BE SENT TO THE RECRUITER
        createNotificationForSuccessfulPaymentToRecruiter(userId, existingRequest, localeService);

        // SEND PUSH NOTIFICATION TO THE FREELANCER
        createNotificationForSuccessfulPaymentToFreelancer(userId, existingRequest, senderFullName, localeService);

        // SEND EMAIL FOR TOP UP REQUEST APPROVED
        sendEmailForTopUpRequestApproved(topUpRequestId);
        message = 'TOP_REQUEST_APPROVED_SUCCESSFULLY';
      }
      if (status === REJECTED) {
        message = 'TOP_REQUEST_REJECTED_SUCCESSFULLY';
      }
      // DELETE NOTIFICATION AFTER APPROVAL/REJECTION FROM FREELANCER
      await NotificationModel.destroy({
        where: {
          receiverId: userId, type: TOP_UP_REQUEST_RECEIVED, refId: topUpRequestId, refType: TOP_UP_REQUEST,
        },
        transaction,
      });
      await transaction.commit();
      return sendSuccessResponse(res, message, OK);
    }
    return sendSuccessResponse(res, 'REQUEST_IS_EITHER_EXPIRED_OR_PENDING', OK);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    topUpRequestsLogger(`Error from sending top up request approval ${error}`, res, 'error');
    return next(error);
  }
};

module.exports = topUpRequestsApproval;
