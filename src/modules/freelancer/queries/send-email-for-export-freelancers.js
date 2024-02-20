const converter = require('json-2-csv');
const Sequelize = require('sequelize');

const { SUCCESS, CSV_EXPORT_CONTENT_TYPE } = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const { EXPORT_DISPUTE_CSV } = require('../../../shared-lib/emails/constants/email-template-constants');
const sendEmail = require('../../../shared-lib/sendgrid');
const { getMessage } = require('../../../utils/messages');
const freelancerLogger = require('../freelancer-logger');

const sortMapper = {
  fullName: 'u.full_name',
  userName: 'u.user_name',
  email: 'u.email',
  verificationStatus: 'u.verification_status',
  categoryName: 'c.name',
  location: 'ub.primary_location',
  pricePerDay: 'ub.price_per_day',
  contactNo: 'u.contact_no',
  isActive: 'u.is_active',
  typeKey: 'up.type_key',
  createdAt: 'u.created_at',
  updatedAt: 'u.updated_at',
  updatedBy: 'u.updated_by',
};

const sendEmailForExportFreelancersService = async (filter = {}, where = {}, email, ctx) => {
  try {
    let sqlDataQuery;
    const { sortOn = 'fullName', sortBy = 'DESC', search = null } = filter;
    const {
      verificationStatus, isActive, categoryName, location, pricePerDay, typeKey,
    } = where;
    const replacements = {
      userVerificationStatus: verificationStatus,
      userIsActive: isActive,
      userCategoryName: categoryName,
      userLocation: location,
      userPricePerDay: pricePerDay,
      userTypeKey: typeKey,
    };
    sqlDataQuery = `SELECT u.full_name AS "fullName",
      c."name" AS "category", u.email,u.country_code || u.contact_no AS "contactNo", u.is_active AS status,
      CASE
        WHEN u.is_active = true THEN 'Active'
        WHEN u.is_active = false THEN 'Inactive'
      END AS "status",
      CASE
        WHEN u.verification_status = 'PENDING' THEN 'Incomplete'
        WHEN u.verification_status = 'REJECTED' THEN 'Incomplete'
        WHEN u.verification_status = 'APPROVED' THEN 'Complete'
      END AS "profileStatus"
    FROM users u
      LEFT JOIN (user_businesses ub
      LEFT JOIN categories c ON ub.category_id = c.id) ON ub.user_id = u.id
      LEFT JOIN user_profiles up ON up.user_id = u.id AND up.deleted_at IS NULL
    WHERE ((u.role = 'FREELANCER') AND u.deleted_at IS NULL)`;

    if (search) {
      sqlDataQuery += ` AND (c.name ILIKE :search OR u.user_name ILIKE :search OR u.full_name ILIKE :search OR
        u.email ILIKE :search OR up.type_key ILIKE :search OR u.contact_no ILIKE :search OR cast(ub.price_per_day as varchar) ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    if (verificationStatus && verificationStatus.length) { sqlDataQuery = `${sqlDataQuery} AND u.verification_status IN (:userVerificationStatus)`; }
    if (isActive && isActive.length) { sqlDataQuery = `${sqlDataQuery} AND u.is_active IN (:userIsActive)`; }
    if (categoryName && categoryName.length) { sqlDataQuery = `${sqlDataQuery} AND c.id IN (:userCategoryName)`; }
    if (location && location.length) { sqlDataQuery = `${sqlDataQuery} AND ub.primary_location IN (:userLocation)`; }
    if (pricePerDay && pricePerDay.length) { sqlDataQuery = `${sqlDataQuery} AND ub.price_per_day IN (:userPricePerDay)`; }
    if (typeKey && typeKey.length) { sqlDataQuery = `${sqlDataQuery} AND up.type_key IN (:userTypeKey)`; }

    sqlDataQuery += ` GROUP BY u.id, ub.id,up.id, c.id ORDER BY ${sortMapper[sortOn]} ${sortBy}`;

    let data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    data = JSON.parse(JSON.stringify(data));
    const csvData = await converter.json2csv(data, {});

    const templateData = {
      templateKey: EXPORT_DISPUTE_CSV,
      toEmailAddress: email,
      attachments: [{
        content: Buffer.from(csvData).toString('base64'),
        filename: 'freelancers.csv',
        type: CSV_EXPORT_CONTENT_TYPE,
        disposition: 'attachment',
      }],
    };
    sendEmail(templateData);
  } catch (error) {
    freelancerLogger(`Error from sendEmailForExportFreelancersService : ${error}`, ctx, 'error');
  }
};

const sendEmailForExportFreelancers = async (_, args, ctx) => {
  try {
    const { req: { user: { email } }, localeService } = ctx;
    const { filter, where } = args;
    sendEmailForExportFreelancersService(filter, where, email, ctx);
    const response = { status: SUCCESS, message: getMessage('EXPORTED_SUCCESSFULLY', localeService) };
    return response;
  } catch (error) {
    freelancerLogger(`Error from sendEmailForExportFreelancers : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = sendEmailForExportFreelancers;
