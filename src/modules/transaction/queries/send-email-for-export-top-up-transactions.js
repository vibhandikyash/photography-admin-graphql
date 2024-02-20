const converter = require('json-2-csv');

const { MODE_OF_PAYMENT, CSV_EXPORT_CONTENT_TYPE, SUCCESS } = require('../../../constants/service-constants');
const { Sequelize, sequelize } = require('../../../sequelize-client');
const { EXPORT_TOP_UP_TRANSACTION_CSV } = require('../../../shared-lib/emails/constants/email-template-constants');
const sendEmail = require('../../../shared-lib/sendgrid');
const { getMessage } = require('../../../utils/messages');
const transactionLogger = require('../transaction-logger');

const sortMapper = {
  createdAt: 'tur.created_at',
  status: 'tur.status::text',
};

const sendEmailForExportTopUpTransactionsService = async (filter = {}, where = {}, email, ctx) => {
  try {
    const { sortOn = 'createdAt', sortBy = 'DESC', search = '' } = filter;
    const { status, createdAt: { before: endDate = null, after: startDate = null } = {} } = where;
    const replacements = {
      modeOfPayment: MODE_OF_PAYMENT.CASH,
      status,
      startDate,
      endDate,
    };

    let sqlDataQuery = `SELECT tur.series_no AS "Series No", TO_CHAR(tur.created_at :: DATE, 'mm/dd/yyyy') AS "Date Of Payment", u.full_name AS "Initiated By", u2.country_code || u2.contact_no AS "Contact No", tur.amount, u2.full_name AS "Paid To", tur.status::text AS "Payment Status" FROM top_up_requests tur
      LEFT JOIN users u ON u.id = tur.sender_id AND u.deleted_at IS NULL
      LEFT JOIN users u2 ON u2.id = tur.receiver_id AND u2.deleted_at IS NULL
    WHERE tur.deleted_at IS NULL AND tur.mode_of_payment::text in (:modeOfPayment)`;

    if (search) {
      sqlDataQuery += ' AND (u.full_name ILIKE :search OR u2.full_name ILIKE :search OR u2.contact_no ILIKE :search)';
      replacements.search = `%${search.trim()}%`;
    }

    if (status) { sqlDataQuery = `${sqlDataQuery} AND (tur.status in (:status))`; }
    if (startDate && endDate) { sqlDataQuery = `${sqlDataQuery} AND (tur.created_at BETWEEN :startDate AND :endDate)`; }

    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy}`;

    let data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    data = JSON.parse(JSON.stringify(data));
    const csvData = await converter.json2csv(data, {});
    const templateData = {
      templateKey: EXPORT_TOP_UP_TRANSACTION_CSV,
      toEmailAddress: email,
      attachments: [{
        content: Buffer.from(csvData).toString('base64'),
        filename: 'top-up-transactions.csv',
        type: CSV_EXPORT_CONTENT_TYPE,
        disposition: 'attachment',
      }],
    };
    sendEmail(templateData);
  } catch (error) {
    transactionLogger(`Error from sendEmailForExportTopUpTransactionsService : ${error}`, ctx, 'error');
  }
};

const sendEmailForExportTopUpTransactions = async (_, args, ctx) => {
  try {
    const { req: { user: { email } }, localeService } = ctx;
    const { filter, where } = args;
    sendEmailForExportTopUpTransactionsService(filter, where, email, ctx);
    const response = { status: SUCCESS, message: getMessage('EXPORTED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    transactionLogger(`Error from sendEmailForExportTopUpTransactions : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = sendEmailForExportTopUpTransactions;
