const converter = require('json-2-csv');
const Sequelize = require('sequelize');

const {
  FREELANCER, COMPLETED, PENDING, SUCCESS, EVENT_FEES, TRAINING_FEES, CSV_EXPORT_CONTENT_TYPE,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { EXPORT_FREELANCER_TRANSACTION_CSV } = require('../../../shared-lib/emails/constants/email-template-constants');
const sendEmail = require('../../../shared-lib/sendgrid');
const { getMessage } = require('../../../utils/messages');
const transactionLogger = require('../transaction-logger');

const sortMapper = {
  freelancerName: 'f.full_name',
  contactNo: 'f.contact_no',
  transactionType: 't.transaction_type::text',
  transactionStatus: 't.transaction_status',
  eventName: 'e.name',
  location: 'e.location',
  createdAt: 't.created_at',
  updatedAt: 't.updated_at',
};

const sendEmailForExportFreelancerTransactionsService = async (filter = {}, where = {}, email, ctx) => {
  try {
    let sqlDataQuery;
    const { sortOn = 'createdAt', sortBy = 'DESC', search = null } = filter;
    const {
      location, transactionType, transactionAmount: { min: minAmount, max: maxAmount } = {}, transactionStatus,
      transactionDate: { from: startDate, to: endDate } = {},
    } = where;

    const replacements = {
      location,
      transactionStatus,
      transactionType,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      uRole: FREELANCER,
      completed: COMPLETED,
      pending: PENDING,
      eventFees: EVENT_FEES,
      trainingFees: TRAINING_FEES,
    };

    sqlDataQuery = `SELECT t.series_no as "seriesNo", to_char(t.created_at :: DATE, 'mm/dd/yyyy') as "date", f.full_name as "fullName", f.country_code || f.contact_no as "contactNo",t.transaction_type::text as "transactionType",
    t.amount, e.name as "event", c.name as "location",t.transaction_status as "paymentStatus"
    FROM "transactions" t
      LEFT JOIN "users" f ON f."id" = t."user_id" AND f.deleted_at IS NULL
      LEFT JOIN "events" e ON e."id" = t."event_id" AND e.deleted_at IS NULL
      LEFT JOIN event_freelancers ef ON ef.user_id = t.user_id AND ef.deleted_at IS NULL
      LEFT JOIN cities c ON c.id = e.location AND c.deleted_at IS NULL
    WHERE (f."role" = :uRole AND ((t.transaction_type = :eventFees AND e.id = ef.event_id) OR (t.transaction_type = :trainingFees)) AND (t.transaction_status in (:completed,:pending))) and t.deleted_at is null`;

    if (search) {
      sqlDataQuery += ` AND (e.name ILIKE :search OR cast(t.transaction_type as text) ILIKE :search OR f.full_name ILIKE :search OR
        f.contact_no ILIKE :search OR cast(t.transaction_status as text) ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    if (location && location.length) { sqlDataQuery = `${sqlDataQuery} AND e."location" IN (:location)`; }
    if (transactionStatus && transactionStatus.length) { sqlDataQuery = `${sqlDataQuery} AND t."transaction_status" IN (:transactionStatus)`; }
    if (transactionType && transactionType.length) { sqlDataQuery = `${sqlDataQuery} AND t."transaction_type" IN (:transactionType)`; }
    if (minAmount && maxAmount) { sqlDataQuery = `${sqlDataQuery} AND (t."amount" BETWEEN :minAmount AND :maxAmount)`; }
    if (endDate && startDate) { sqlDataQuery = `${sqlDataQuery} AND (t."created_at" BETWEEN :startDate AND :endDate)`; }

    sqlDataQuery += ` GROUP BY t.id,f.id,e.id,ef.id,c.name ORDER BY ${sortMapper[sortOn]} ${sortBy}`;

    let data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    data = JSON.parse(JSON.stringify(data));
    const csvData = await converter.json2csv(data, {});
    const templateData = {
      templateKey: EXPORT_FREELANCER_TRANSACTION_CSV,
      toEmailAddress: email,
      attachments: [{
        content: Buffer.from(csvData).toString('base64'),
        filename: 'freelancer-transactions.csv',
        type: CSV_EXPORT_CONTENT_TYPE,
        disposition: 'attachment',
      }],
    };
    sendEmail(templateData);
  } catch (error) {
    transactionLogger(`Error while sendEmailForExportFreelancerTransactionsService : ${error}`, ctx, 'error');
  }
};

const sendEmailForExportFreelancerTransactions = async (_, args, ctx) => {
  try {
    const { filter, where } = args;
    const { req: { user: { email } }, localeService } = ctx;
    sendEmailForExportFreelancerTransactionsService(filter, where, email, ctx);
    const response = { status: SUCCESS, message: getMessage('EXPORTED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    transactionLogger(`Error while sendEmailForExportFreelancerTransactions : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = sendEmailForExportFreelancerTransactions;
