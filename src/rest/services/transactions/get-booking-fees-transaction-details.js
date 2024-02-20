/* eslint-disable no-restricted-syntax */
const { map, has, set } = require('lodash');
const { Op } = require('sequelize');

const { EVENT_FEES, CANCELLED } = require('../../../constants/service-constants');
const {
  models: {
    User: UserModel, Transaction: TransactionModel, UserBusiness: UserBusinessModel, Category: CategoryModel,
  },
} = require('../../../sequelize-client');

const eventLogger = require('../../modules/events/event-logger');

const getBookingFeesTransactionDetails = async eventId => {
  try {
    let eventFreelancersFee = await TransactionModel.findAll(
      {
        where: { eventId, transactionType: EVENT_FEES, transactionStatus: { [Op.not]: CANCELLED } },
        attributes: ['id', 'createdAt', ['amount', 'finalizedPrice'], 'note'],
        include: [
          {
            model: UserModel,
            as: 'user',
            attributes: ['id', 'fullName'],
            include: {
              model: UserBusinessModel,
              as: 'business',
              attributes: ['id'],
              include: { model: CategoryModel, as: 'userCategory', attributes: ['id', 'name'] },
            },
          }],
      },
    );
    eventFreelancersFee = JSON.parse(JSON.stringify(eventFreelancersFee));

    const eventFreelancers = map(eventFreelancersFee, freelancer => {
      if (has(freelancer, 'user.business.userCategory')) {
        set(freelancer, 'user.business.category', freelancer.user.business.userCategory);
      }
      return freelancer;
    });

    const response = { freelancers: eventFreelancers };

    return response;
  } catch (error) {
    eventLogger(`Error from get-booking-fees-transaction-details: ${error.message}`, null, 'error');
    return error;
  }
};

module.exports = getBookingFeesTransactionDetails;
