const converter = require('json-2-csv');
const Sequelize = require('sequelize');

const { CSV_EXPORT_CONTENT_TYPE, SUCCESS } = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { EXPORT_RECRUITER_CSV } = require('../../../shared-lib/emails/constants/email-template-constants');
const sendEmail = require('../../../shared-lib/sendgrid');
const { getMessage } = require('../../../utils/messages');
const recruiterLogger = require('../../location/location-logger');

const sortMapper = {
  fullName: 'u.full_name',
  userName: 'u.user_name',
  email: 'u.email',
  verificationStatus: 'u.verification_status',
  contactNo: 'u.contact_no',
  companyName: 'ub.company_name',
  isActive: 'u.is_active',
  createdAt: 'u.created_at',
  updatedAt: 'u.updated_at',
  updatedBy: 'u.updated_by',
};

const sendEmailForExportRecruitersService = async (filter = {}, where = {}, email, ctx) => {
  try {
    let sqlDataQuery;
    const { sortOn = 'fullName', sortBy = 'DESC', search = null } = filter;
    const { verificationStatus, isActive, typeKey } = where;
    const replacements = { userVerificationStatus: verificationStatus, userIsActive: isActive, userTypeKey: typeKey };

    sqlDataQuery = `SELECT u.full_name AS "fullName", u.email, u.country_code || u.contact_no AS "contactNo",  ub.company_name AS "companyName", u.is_active AS "status",
    CASE
      WHEN u.is_active = true THEN 'Active'
      WHEN u.is_active = false THEN 'Inactive'
    END AS "status",
    CASE
      WHEN u.verification_status = 'PENDING' THEN 'Incomplete'
      WHEN u.verification_status = 'REJECTED' THEN 'Incomplete'
      WHEN u.verification_status = 'APPROVED' THEN 'Complete'
    END AS "profileStatus"
    FROM public.users u
      LEFT JOIN user_businesses ub ON ub.user_id = u.id AND ub.deleted_at IS NULL
      LEFT JOIN user_profiles up ON up.user_id = u.id AND up.deleted_at IS NULL
    WHERE ((u.role = 'RECRUITER') AND u.deleted_at IS NULL)`;

    if (search) {
      sqlDataQuery += ` AND (u.user_name ILIKE :search OR u.full_name ILIKE :search OR
        u.email ILIKE :search OR ub.company_name ILIKE :search OR u.contact_no ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    if (verificationStatus && verificationStatus.length) { sqlDataQuery = `${sqlDataQuery} AND u.verification_status IN (:userVerificationStatus)`; }
    if (isActive && isActive.length) { sqlDataQuery = `${sqlDataQuery} AND u.is_active IN (:userIsActive)`; }
    if (typeKey && typeKey.length) { sqlDataQuery = `${sqlDataQuery} AND up.type_key IN (:userTypeKey)`; }

    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy}`;
    let data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    data = JSON.parse(JSON.stringify(data));

    const csvData = await converter.json2csv(data, {});
    const templateData = {
      templateKey: EXPORT_RECRUITER_CSV,
      toEmailAddress: email,
      attachments: [{
        content: Buffer.from(csvData).toString('base64'),
        filename: 'recruiters.csv',
        type: CSV_EXPORT_CONTENT_TYPE,
        disposition: 'attachment',
      }],
    };
    sendEmail(templateData);
  } catch (error) {
    recruiterLogger(`Error from sendEmailForExportRecruitersService: ${error}`, ctx, 'error');
  }
};

const sendEmailForExportRecruiters = async (_, args, ctx) => {
  try {
    const { req: { user: { email } }, localeService } = ctx;
    const { filter, where } = args;
    sendEmailForExportRecruitersService(filter, where, email, ctx);
    const response = { status: SUCCESS, message: getMessage('EXPORTED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    recruiterLogger(`Error from sendEmailForExportRecruiters: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = sendEmailForExportRecruiters;
