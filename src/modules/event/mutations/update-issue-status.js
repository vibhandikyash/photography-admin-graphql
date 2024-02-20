/* eslint-disable max-len */
const moment = require('moment');

const { SUCCESS, RESOLVED, DISPUTE_RESOLUTION_VALIDITY_IN_HOURS } = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const sendEmailForDisputeResolved = require('../../../shared-lib/emails/dispute/send-email-for-dispute-resolved');
const { CustomApolloError } = require('../../../shared-lib/error-handler');

const createNotificationForDisputeResolvedStatus = require('../../../shared-lib/notifications/disputes/create-notification-for-dispute-resolved-status');
const { getMessage } = require('../../../utils/messages');
const eventsLogger = require('../event-logger');

const updateIssueStatus = async (_, args, ctx) => {
  let transaction;
  try {
    transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const {
      models: {
        Dispute: DisputeModel,
        User: UserModel,
      },
      localeService,
    } = ctx;

    const { data } = args;
    const { user } = ctx.req;
    const { id } = args.where;
    const { resolution, status } = data;

    const existingDispute = await DisputeModel.findByPk(
      id,
      {
        include: [
          {
            model: UserModel,
            as: 'creator',
            attributes: ['id', 'fullName', 'email'],
          },
          {
            model: UserModel,
            as: 'user',
            attributes: ['id', 'fullName', 'email'],
          },
        ],
      },
    );

    if (!existingDispute) {
      throw new CustomApolloError(getMessage('ISSUE_NOT_FOUND', localeService));
    }

    const issueData = {
      resolution,
      status,
    };

    const { createdAt, creator, user: raisedForUser } = existingDispute;

    const hoursDiff = moment().diff(moment(createdAt), 'hours');
    if (hoursDiff > DISPUTE_RESOLUTION_VALIDITY_IN_HOURS) {
      throw new CustomApolloError(getMessage('ISSUE_CANNOT_BE_RESOLVED', localeService,
        { disputeResolvedValidityHours: DISPUTE_RESOLUTION_VALIDITY_IN_HOURS }));
    }

    await DisputeModel.update(issueData, { where: { id } }, { transaction });
    if (status === RESOLVED) {
      sendEmailForDisputeResolved(id);
      createNotificationForDisputeResolvedStatus(user.id, creator.id, raisedForUser.id, existingDispute, localeService);
    }

    await transaction.commit();

    const response = {
      status: SUCCESS,
      message: getMessage('ISSUE_UPDATED_SUCCESSFULLY', localeService),
    };
    return response;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    eventsLogger(`Error updating-issue-status: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = updateIssueStatus;
