/* eslint-disable prefer-const */
/* eslint-disable array-callback-return */
const { isBoolean } = require('lodash');
const Sequelize = require('sequelize');

const { QUERY_PAGING_MAX_COUNT, QUERY_PAGING_MIN_COUNT } = require('../../../config/config');

const { sequelize } = require('../../../sequelize-client');
const recruiterLogger = require('../../location/location-logger');

const sortMapper = {
  id: 'id',
  fullName: 'full_name',
  userName: 'user_name',
  email: 'email',
  verificationStatus: 'verification_status',
  contactNo: 'contact_no',
  companyName: 'ub.company_name',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  updatedBy: 'updated_by',
};

const listRecruiters = async (_, args, ctx) => {
  try {
    const {
      filter: {
        sortOn = 'id', sortBy = 'DESC', skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      } = {}, where: {
        verificationStatus, isActive, typeKey, isDeleted,
      } = {},
    } = args;
    const replacements = {
      userVerificationStatus: verificationStatus,
      userIsActive: isActive,
      userTypeKey: typeKey,
      isDeleted,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
    };

    let sqlDataQuery = `SELECT u.id, u.full_name, u.user_name, u.email, u.verification_status, u.contact_no, u.role, u.is_active, u.updated_by, u.created_by, u.created_at, u.updated_at,
    u.country_code, ub.company_name, ub.instagram_link, up.type_key, up.aadhar_card_back, up.aadhar_card_front
    FROM public.users u
    LEFT JOIN user_businesses ub ON ub.user_id = u.id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE ((u.role = 'RECRUITER') and u.deleted_at is null) `;

    if (search) {
      sqlDataQuery += ` AND (u.full_name ILIKE :search OR u.user_name ILIKE :search OR u.email ILIKE :search OR u.contact_no ILIKE :search
        OR ub.company_name ILIKE :search) `;
      replacements.search = `%${search.trim()}%`;
    }

    if (verificationStatus && verificationStatus.length) { sqlDataQuery = `${sqlDataQuery} and u.verification_status in (:userVerificationStatus)`; }
    if (isActive && isActive.length) { sqlDataQuery = `${sqlDataQuery} and u.is_active in (:userIsActive)`; }
    if (typeKey && typeKey.length) { sqlDataQuery = `${sqlDataQuery} and up.type_key in (:userTypeKey)`; }
    if (isBoolean(isDeleted)) {
      sqlDataQuery = `${sqlDataQuery} AND u.account_deleted_at ${isDeleted ? 'is not' : 'is'} null`;
    }
    sqlDataQuery += ' group by u.id, ub.company_name, up.type_key, ub.instagram_link, up.aadhar_card_front, up.aadhar_card_back';
    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as usersCount`;

    // eslint-disable-next-line security/detect-object-injection
    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy} limit :limit offset :skip`;

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    const result = {
      count: parseInt(count[0].count, 10),
      data,
    };
    return result;
  } catch (error) {
    recruiterLogger(`Error from  list-recruiters : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listRecruiters;
