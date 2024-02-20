/* eslint-disable no-restricted-syntax */
const { get, filter } = require('lodash');
const { Op } = require('sequelize');

const { REGULARIZE_REQUEST_TYPES: { REGULARIZE, INSUFFICIENT_HOURS } } = require('../../../constants/service-constants');

const { sequelize, Sequelize } = require('../../../sequelize-client');
const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');

const regularizationLogger = require('../regularization-logger');

const regularizeRequestDetails = async (_, args, ctx) => {
  try {
    const { models: { RegularizeRequest: RegularizeRequestModel, Transaction: TransactionModel }, localeService } = ctx;
    const { where: { id: requestId } } = args;

    const existingRequest = await RegularizeRequestModel.findByPk(requestId);
    if (!existingRequest) {
      throw new CustomApolloError(getMessage('REGULARIZE_REQUEST_NOT_FOUND', localeService));
    }
    const { requestType } = existingRequest;

    let sqlDataQueryForRegularizeRequest;
    if (requestType === REGULARIZE) {
      sqlDataQueryForRegularizeRequest = `SELECT
      JSON_BUILD_OBJECT('id', rr.id, 'endDate', rr.ended_at, 'startDate', rr.started_at, 'oldNoOfDays',rr.meta_data->'oldNoOfDays', 'updatedNoOfDays',rr.meta_data->'updatedNoOfDays') AS "regularizeRequest",
      JSONB_BUILD_OBJECT('startDate',rr.meta_data->'freelancerAttendances'->>'firstClockIn', 'endDate',rr.meta_data->'freelancerAttendances'->>'lastClockOut') AS "freelancerAttendanceTimings"
      FROM regularize_requests rr
      WHERE rr.id = :requestId AND rr.deleted_at is null;`;
    } else if (requestType === INSUFFICIENT_HOURS) {
      sqlDataQueryForRegularizeRequest = `SELECT
      JSON_BUILD_OBJECT('id', rr.id, 'endDate', rr.ended_at, 'startDate', rr.started_at, 'oldNoOfDays',rr.meta_data->'oldNoOfDays', 'updatedNoOfDays',rr.meta_data->'updatedNoOfDays') AS "freelancerAttendanceTimings"
      FROM regularize_requests rr
      WHERE rr.id = :requestId AND rr.deleted_at is null;`;
    }
    const replacements = { requestId };

    const regularizeRequestTransaction = await TransactionModel.findAll({
      attributes: ['amount', 'transactionType', 'metaData'],
      where: {
        [Op.or]: [
          { metaData: { regularizeRequests: { cancelledById: requestId } } },
          { metaData: { regularizeRequests: { createdById: requestId } } },
        ],
      },
    });
    let regularizeRequestLogs = await sequelize.query(sqlDataQueryForRegularizeRequest, { replacements, type: Sequelize.QueryTypes.SELECT });

    regularizeRequestLogs = ({ ...regularizeRequestLogs[0] });
    const previousTransactionDataResponse = {};
    const updatedTransactionDataResponse = {};

    const previousTransactionData = filter(regularizeRequestTransaction, ['metaData.regularizeRequests.cancelledById', requestId]);
    const updatedTransactionData = filter(regularizeRequestTransaction, ['metaData.regularizeRequests.createdById', requestId]);

    if (previousTransactionData.length) {
      for (const data of previousTransactionData) {
        previousTransactionDataResponse[`${data.transactionType}`] = data.amount;
      }
      if (requestType === REGULARIZE) {
        previousTransactionDataResponse.noOfDays = get(regularizeRequestLogs, 'regularizeRequest.oldNoOfDays');
      } else if (requestType === INSUFFICIENT_HOURS) {
        previousTransactionDataResponse.noOfDays = get(regularizeRequestLogs, 'freelancerAttendanceTimings.oldNoOfDays');
      }
    }

    if (updatedTransactionData.length) {
      for (const data of updatedTransactionData) {
        updatedTransactionDataResponse[`${data.transactionType}`] = data.amount;
      }
      if (requestType === REGULARIZE) {
        updatedTransactionDataResponse.noOfDays = get(regularizeRequestLogs, 'regularizeRequest.updatedNoOfDays');
      } else if (requestType === INSUFFICIENT_HOURS) {
        updatedTransactionDataResponse.noOfDays = get(regularizeRequestLogs, 'freelancerAttendanceTimings.updatedNoOfDays');
      }
    }

    const result = {
      ...regularizeRequestLogs, previousTransactionData: previousTransactionDataResponse, updatedTransactionData: updatedTransactionDataResponse,
    };
    return result;
  } catch (error) {
    regularizationLogger(`Error from getting regularization request details, ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = regularizeRequestDetails;
