/* eslint-disable no-underscore-dangle */
/* eslint-disable max-lines */
const { isNaN } = require('lodash');

const { BOOKING_FEES, CONFIGURATION_KEYS: { CONVENIENCE_FEES } } = require('../../constants/service-constants');

const TransactionTypeKeys = [BOOKING_FEES, CONVENIENCE_FEES];

const transactionFieldResolvers = {
  FreelancerTransactionListRaw: {
    freelancerName: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.freelancer_name,
    },
    freelancerContactNo: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.freelancer_contact_no,
    },
    countryCode: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.country_code,
    },
    transactionType: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.transaction_type,
    },
    eventName: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.event_name,
    },
    startDate: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.start_date,
    },
    endDate: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.end_date,
    },
    paymentStatus: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.transaction_status,
    },
    freelancerBreakdown: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.freelancer_breakdown,
    },
    transactionDate: {
      resolve: RecruiterTransactionListRaw => RecruiterTransactionListRaw.transaction_date,
    },
  },
  FreelancerBreakdownRaw: {
    perDayPrice: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.per_day_price,
    },
    feesAmount: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.fees_amount,
    },
    finalAmount: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.final_amount,
    },
    eventId: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.event_id,
    },
    eventName: {
      resolve: FreelancerTransactionListRaw => FreelancerTransactionListRaw.event_name,
    },
  },
  RecruiterTransactionListRaw: {
    amount: {
      resolve: RecruiterTransactionListRaw => {
        if (isNaN(RecruiterTransactionListRaw.amount)) {
          return 0;
        }
        if (TransactionTypeKeys.includes(RecruiterTransactionListRaw.transaction_type)) {
          return -RecruiterTransactionListRaw.amount;
        }
        return RecruiterTransactionListRaw.amount;
      },
    },
    updatedBalance: {
      resolve: RecruiterTransactionListRaw => {
        if (isNaN(RecruiterTransactionListRaw.updatedBalance)) {
          return 0;
        }
        return RecruiterTransactionListRaw.updatedBalance;
      },
    },
    // transactionDate: {
    //   resolve: RecruiterTransactionListRaw => RecruiterTransactionListRaw.transaction_date,
    // },
    bookingTransactionBreakdown: {
      resolve: RecruiterTransactionListRaw => RecruiterTransactionListRaw.bookingTransactionBreakdown,
    },
    convenienceTransactionBreakdown: {
      resolve: RecruiterTransactionListRaw => RecruiterTransactionListRaw.convenienceTransactionBreakdown,
    },
    bookingFeesRefundTransactionBreakdown: {
      resolve: RecruiterTransactionListRaw => RecruiterTransactionListRaw.bookingFeesRefundTransactionBreakdown,
    },
    cancellationFeesTransactionBreakdown: {
      resolve: RecruiterTransactionListRaw => RecruiterTransactionListRaw.cancellationFeesTransactionBreakdown,
    },
    // waiveOffCancellationBreakdown: {
    //   resolve: RecruiterTransactionListRaw => RecruiterTransactionListRaw.waive_off_cancellation_breakdown,
    // },
    // waiveOffConvenienceBreakdown: {
    //   resolve: RecruiterTransactionListRaw => RecruiterTransactionListRaw.waive_off_convenience_breakdown,
    // },
  },
  BookingTransactionBreakdownRaw: {
    freelancerName: {
      resolve: BookingTransactionBreakdownRaw => BookingTransactionBreakdownRaw.freelancer_name,
    },
    transactionType: {
      resolve: BookingTransactionBreakdownRaw => BookingTransactionBreakdownRaw.transaction_type,
    },
    perDayPrice: {
      resolve: BookingTransactionBreakdownRaw => BookingTransactionBreakdownRaw.per_day_price,
    },
    startDate: {
      resolve: BookingTransactionBreakdownRaw => BookingTransactionBreakdownRaw.start_date,
    },
    endDate: {
      resolve: BookingTransactionBreakdownRaw => BookingTransactionBreakdownRaw.end_date,
    },
    finalAmount: {
      resolve: BookingTransactionBreakdownRaw => BookingTransactionBreakdownRaw.final_amount,
    },
    modeOfPayment: {
      resolve: BookingTransactionBreakdownRaw => BookingTransactionBreakdownRaw.mode_of_payment,
    },
  },
  ConvenienceTransactionBreakdownRaw: {
    startDate: {
      resolve: ConvenienceTransactionBreakdownRaw => ConvenienceTransactionBreakdownRaw.start_date,
    },
    endDate: {
      resolve: ConvenienceTransactionBreakdownRaw => ConvenienceTransactionBreakdownRaw.end_date,
    },
    numberOfFreelancers: {
      resolve: ConvenienceTransactionBreakdownRaw => ConvenienceTransactionBreakdownRaw.number_of_freelancers,
    },
    charges: {
      resolve: ConvenienceTransactionBreakdownRaw => ConvenienceTransactionBreakdownRaw.charges,
    },
    transactionType: {
      resolve: ConvenienceTransactionBreakdownRaw => ConvenienceTransactionBreakdownRaw.transaction_type,
    },
    finalAmount: {
      resolve: ConvenienceTransactionBreakdownRaw => ConvenienceTransactionBreakdownRaw.final_amount,
    },
    modeOfPayment: {
      resolve: ConvenienceTransactionBreakdownRaw => ConvenienceTransactionBreakdownRaw.mode_of_payment,
    },
  },
  BookingFeesRefundTransactionBreakdownRaw: {
    startDate: {
      resolve: BookingFeesRefundTransactionBreakdownRaw => BookingFeesRefundTransactionBreakdownRaw.start_date,
    },
    endDate: {
      resolve: BookingFeesRefundTransactionBreakdownRaw => BookingFeesRefundTransactionBreakdownRaw.end_date,
    },
    cancelledFreelancer: {
      resolve: BookingFeesRefundTransactionBreakdownRaw => BookingFeesRefundTransactionBreakdownRaw.cancelled_freelancer,
    },
    cancelledFreelancerFees: {
      resolve: BookingFeesRefundTransactionBreakdownRaw => BookingFeesRefundTransactionBreakdownRaw.cancelled_freelancer_fees,
    },
    modeOfPayment: {
      resolve: BookingFeesRefundTransactionBreakdownRaw => BookingFeesRefundTransactionBreakdownRaw.mode_of_payment,
    },
  },
  CancellationFeesTransactionBreakdown: {
    startDate: {
      resolve: CancellationFeesTransactionBreakdown => CancellationFeesTransactionBreakdown.start_date,
    },
    endDate: {
      resolve: CancellationFeesTransactionBreakdown => CancellationFeesTransactionBreakdown.end_date,
    },
    cancellationDate: {
      resolve: CancellationFeesTransactionBreakdown => CancellationFeesTransactionBreakdown.cancellation_date,
    },
    eventCost: {
      resolve: CancellationFeesTransactionBreakdown => CancellationFeesTransactionBreakdown.event_cost,
    },
    cancellationPercentage: {
      resolve: CancellationFeesTransactionBreakdown => CancellationFeesTransactionBreakdown.cancellation_percentage,
    },
    cancellationCharges: {
      resolve: CancellationFeesTransactionBreakdown => CancellationFeesTransactionBreakdown.cancellation_charges,
    },
    modeOfPayment: {
      resolve: CancellationFeesTransactionBreakdown => CancellationFeesTransactionBreakdown.mode_of_payment,
    },
  },
  TransactionDetailsByEventRaw: {
    eventName: {
      resolve: TransactionDetailsByEventRaw => TransactionDetailsByEventRaw.event_name,
    },
    numberOfDaysOfEvent: {
      resolve: TransactionDetailsByEventRaw => TransactionDetailsByEventRaw.number_of_days_of_event,
    },
    numberOfFreelancers: {
      resolve: TransactionDetailsByEventRaw => TransactionDetailsByEventRaw.number_of_freelancers,
    },
    convenienceFees: {
      resolve: TransactionDetailsByEventRaw => {
        if (isNaN(TransactionDetailsByEventRaw.convenience_fees)) {
          return 0;
        }
        return TransactionDetailsByEventRaw.convenience_fees;
      },
    },
  },
  AssignedFreelancersTransactionDetails: {
    freelancerName: {
      resolve: AssignedFreelancersTransactionDetails => AssignedFreelancersTransactionDetails.freelancer_name,
    },
    freelanceCategory: {
      resolve: AssignedFreelancersTransactionDetails => AssignedFreelancersTransactionDetails.freelancer_category,
    },
    finalAmount: {
      resolve: AssignedFreelancersTransactionDetails => AssignedFreelancersTransactionDetails.final_amount,
    },
  },
  TransactionRaw: {
    transactionType: {
      resolve: TransactionRaw => TransactionRaw.transaction_type,
    },
    transactionStatus: {
      resolve: TransactionRaw => TransactionRaw.transaction_status,
    },
    transactionSubType: {
      resolve: TransactionRaw => TransactionRaw.transaction_sub_type,
    },
    eventId: {
      resolve: TransactionRaw => TransactionRaw.event_id,
    },
    userId: {
      resolve: TransactionRaw => TransactionRaw.user_id,
    },
    modeOfTransaction: {
      resolve: TransactionRaw => TransactionRaw.mode_of_transaction,
    },
    createdAt: {
      resolve: TransactionRaw => TransactionRaw.created_at,
    },
  },
  GetRecruiterWebPaymentDetailsResponse: {
    __resolveType(parent) {
      const { type } = parent;
      const typeMap = {
        BOOKING_FEES: 'BookingFeesPayment',
        CANCELLATION_CHARGES: 'CancellationFeesPayment',
      };
      return typeMap[type];
    },
  },
};

module.exports = transactionFieldResolvers;
