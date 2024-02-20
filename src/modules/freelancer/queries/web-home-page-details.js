const { Op } = require('sequelize');

const {
  COMPLETED, FREELANCER, COMMISSION, BOOKING_FEES, TRAINING_FEES, ADDITIONAL_BOOKING_FEES, TOP_UP,
} = require('../../../constants/service-constants');
const freelancerLogger = require('../freelancer-logger');

const webHomePageDetails = async (_, args, ctx) => {
  try {
    const { models: { Event: EventModel, User: UserModel, Transaction: TransactionModel } } = ctx;

    const [completedProject, totalFreelancer, businessGenerated] = await Promise.all([
      EventModel.count({ where: { status: COMPLETED } }),
      UserModel.count({ where: { role: FREELANCER } }),
      TransactionModel.sum('amount', {
        where: {
          transactionType: { [Op.in]: [COMMISSION, BOOKING_FEES, TRAINING_FEES, ADDITIONAL_BOOKING_FEES, TOP_UP] },
        },
      }),
    ]);

    const response = { completedProject, totalFreelancer, businessGenerated: businessGenerated || 0 };

    return response;
  } catch (error) {
    freelancerLogger(`Error from  webHomePageDetails : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = webHomePageDetails;
