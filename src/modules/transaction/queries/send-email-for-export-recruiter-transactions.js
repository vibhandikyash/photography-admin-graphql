const converter = require('json-2-csv');
const Sequelize = require('sequelize');

const {
  RECRUITER, COMPLETED, PENDING, SUCCESS, CSV_EXPORT_CONTENT_TYPE, BOOKING_FEES, CONFIGURATION_KEYS: { CONVENIENCE_FEES },
  CANCELLATION_CHARGES, REFUND, WAIVE_OFF, INITIAL_FEES, TOP_UP,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { EXPORT_RECRUITER_TRANSACTION_CSV } = require('../../../shared-lib/emails/constants/email-template-constants');
const sendEmail = require('../../../shared-lib/sendgrid');
const { getMessage } = require('../../../utils/messages');
const transactionLogger = require('../transaction-logger');

const transactionTypes = [BOOKING_FEES, CONVENIENCE_FEES, CANCELLATION_CHARGES, REFUND, WAIVE_OFF, INITIAL_FEES, TOP_UP];
const sortMapper = {
  recruiterName: 'r.full_name',
  contactNo: 'r.contact_no',
  transactionType: 't.transaction_type',
  transactionStatus: 't.transaction_status',
  eventName: 'e.name',
  location: 'e.location',
  createdAt: 't.created_at',
  updatedAt: 't.updated_at',
};

const sendEmailForExportRecruiterTransactionsService = async (filter = {}, where = {}, email, ctx) => {
  try {
    let sqlDataQuery;
    const { sortOn = 'createdAt', sortBy = 'DESC', search = null } = filter;
    const {
      transactionDate: { from: startDate, to: endDate } = {},
      transactionAmount: { min: minAmount, max: maxAmount } = {}, paymentMode, transactionType,
    } = where;
    const replacements = {
      paymentMode,
      transactionType,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      uRole: RECRUITER,
      completed: COMPLETED,
      pending: PENDING,
      transactionTypes,
    };
    sqlDataQuery = `SELECT t.series_no as "seriesNo", to_char(t.created_at :: DATE, 'mm/dd/yyyy') as "date", r.full_name as "name",r.country_code || r.contact_no as "contactNo",e.name as "event",t.transaction_type as "transactionType",
    t.transaction_sub_type as "transactionSubType", t.amount, t.mode_of_transaction as "paymentMode",t.closing_balance as "updatedBalance"
    FROM transactions t
      LEFT JOIN events e ON e.id = t.event_id AND e.deleted_at is null
      LEFT JOIN cities c on c.id = e."location" AND c.deleted_at IS NULL
      LEFT JOIN users r on r.id = t."user_id" AND r.deleted_at IS NULL
    WHERE transaction_type IN (:transactionTypes)
    AND r.role = :uRole  AND (t.transaction_status in (:completed,:pending)) AND t.deleted_at IS NULL`;

    if (search) {
      sqlDataQuery += ` AND (e.name ILIKE :search OR cast(t.transaction_type as text) ILIKE :search OR r.full_name ILIKE :search OR
        r.contact_no ILIKE :search OR cast(t.transaction_status as text) ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }
    if (paymentMode && paymentMode.length) { sqlDataQuery = `${sqlDataQuery} AND t."mode_of_transaction" IN (:paymentMode)`; }
    if (transactionType && transactionType.length) { sqlDataQuery = `${sqlDataQuery} AND t."transaction_type" IN (:transactionType)`; }
    if (minAmount && maxAmount) { sqlDataQuery = `${sqlDataQuery} AND (t."amount" BETWEEN :minAmount AND :maxAmount)`; }
    if (endDate && startDate) { sqlDataQuery = `${sqlDataQuery} AND (t."created_at" BETWEEN :startDate AND :endDate)`; }

    sqlDataQuery += ` GROUP BY t.id,r.id,e.id,c.name ORDER BY ${sortMapper[sortOn]} ${sortBy}`;
    let data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    data = JSON.parse(JSON.stringify(data));
    const csvData = await converter.json2csv(data, {});
    const templateData = {
      templateKey: EXPORT_RECRUITER_TRANSACTION_CSV,
      toEmailAddress: email,
      attachments: [{
        content: Buffer.from(csvData).toString('base64'),
        filename: 'recruiter-transactions.csv',
        type: CSV_EXPORT_CONTENT_TYPE,
        disposition: 'attachment',
      }],
    };
    sendEmail(templateData);
  } catch (error) {
    transactionLogger(`Error from sendEmailForExportRecruiterTransactionsService : ${error}`, ctx, 'error');
  }
};

const sendEmailForExportRecruiterTransactions = async (_, args, ctx) => {
  try {
    const { req: { user: { email } }, localeService } = ctx;
    const { filter, where } = args;
    sendEmailForExportRecruiterTransactionsService(filter, where, email, ctx);
    const response = { status: SUCCESS, message: getMessage('EXPORTED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    transactionLogger(`Error from sendEmailForExportRecruiterTransactions : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = sendEmailForExportRecruiterTransactions;
