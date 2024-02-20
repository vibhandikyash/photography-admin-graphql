const converter = require('json-2-csv');

const { CSV_EXPORT_CONTENT_TYPE, SUCCESS } = require('../../../constants/service-constants');
const { sequelize, Sequelize } = require('../../../sequelize-client');
const { EXPORT_DISPUTE_CSV } = require('../../../shared-lib/emails/constants/email-template-constants');
const sendEmail = require('../../../shared-lib/sendgrid');
const { getMessage } = require('../../../utils/messages');
const disputeLogger = require('../dispute-logger');

const sortMapper = {
  raisedBy: 'u2.full_name',
  raisedByContact: 'u.contact_no',
  raisedFor: 'u.full_name',
  raisedForContact: 'u2.contact_no',
  eventName: 'e.name',
  location: 'e.location',
  status: 'il.status',
  createdAt: 'il.created_at',
};

const sendEmailForExportDisputeService = async (filter = {}, where = {}, email, ctx) => {
  try {
    let sqlDataQuery;
    const { sortOn = 'createdAt', sortBy = 'DESC', search = null } = filter;
    const { status = [], location = [], createdAt: { from: startDate, to: endDate } = {} } = where;
    const replacements = {
      status, location, startDate, endDate,
    };
    sqlDataQuery = `SELECT il.ticket_no AS "ticketNo", e.name AS "eventName", u2.full_name AS "raisedBy", u2.country_code || u2.contact_no AS "raisedByContact", u.full_name AS "raisedFor",u.country_code || u.contact_no AS "raisedForContact",to_char(il.created_at :: DATE, 'mm/dd/yyyy') AS "date", c.name AS "location", il.status as "resolutionStatus"
    FROM disputes il
      LEFT JOIN "events" e ON e.id = il.event_id AND e.deleted_at IS NULL
      LEFT JOIN cities c ON e."location" = c.id AND c.deleted_at IS NULL
      LEFT JOIN "users" u ON u.id = il.user_id
      LEFT JOIN "users" u2 ON u2.id = il.raised_by
    WHERE (u.deleted_at IS NULL AND u2.deleted_at IS NULL AND il.deleted_at IS NULL)`;

    if (search) {
      sqlDataQuery += ' AND (u.full_name ILIKE :search OR u2.full_name ILIKE :search OR e.name ILIKE :search)';
      replacements.search = `%${search.trim()}%`;
    }

    if (status.length) { sqlDataQuery = `${sqlDataQuery} AND il.status IN (:status)`; }
    if (location.length) { sqlDataQuery = `${sqlDataQuery} AND e.location IN (:location)`; }
    if (startDate && endDate) { sqlDataQuery = `${sqlDataQuery} AND (il."created_at" BETWEEN :startDate AND :endDate)`; }

    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy}`;

    let data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    data = JSON.parse(JSON.stringify(data));
    const csvData = await converter.json2csv(data, {});
    const templateData = {
      templateKey: EXPORT_DISPUTE_CSV,
      toEmailAddress: email,
      attachments: [{
        content: Buffer.from(csvData).toString('base64'),
        filename: 'dispute.csv',
        type: CSV_EXPORT_CONTENT_TYPE,
        disposition: 'attachment',
      }],
    };
    sendEmail(templateData);
  } catch (error) {
    disputeLogger(`Error from sendEmailForExportDisputeService, ${error}`, ctx, 'error');
  }
};

const sendEmailForExportDispute = async (_, args, ctx) => {
  try {
    const { filter, where } = args;
    const { req: { user: { email } }, localeService } = ctx;
    sendEmailForExportDisputeService(filter, where, email, ctx);
    const response = { status: SUCCESS, message: getMessage('EXPORTED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    disputeLogger(`Error from sendEmailForExportDispute : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = sendEmailForExportDispute;
