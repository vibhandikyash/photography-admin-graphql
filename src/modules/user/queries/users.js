/* eslint-disable security/detect-object-injection */
/* eslint-disable prefer-const */
/* eslint-disable eqeqeq */
/* eslint-disable array-callback-return */
const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');

const { sequelize } = require('../../../sequelize-client');
const userLogger = require('../user-logger');

const sortMapper = {
  id: 'id',
  fullName: 'full_name',
  userName: 'user_name',
  email: 'email',
  verificationStatus: 'verification_status',
  contactNo: 'contact_no',
  role: 'role',
  isFeatured: 'is_featured',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  updatedBy: 'updated_by',
};

const searchColumns = [
  'full_name',
  'user_name',
  'email',
  'contact_no',
];

const users = async (_, args, ctx) => {
  try {
    const { user } = ctx.req;
    let sqlDataQuery; let sqlCountQuery; let replacements = {};
    const {
      filter: {
        sortOn = 'id', sortBy = 'DESC', skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      }, where,
    } = args;

    sqlDataQuery = `select
    "id",
    "full_name",
    "user_name",
    "email",
    "verification_status",
    "contact_no",
    "country_code",
    "role",
    "is_active",
    "updated_by",
    created_by,
    created_at,
    updated_at
    from
      public."users"
    where
      (("role" NOT in ('SUPER_ADMIN','RECRUITER','FREELANCER')  and "id" != :userId) and deleted_at is null) `;
    replacements = { ...replacements, userId: user.id };

    if (search) {
      searchColumns.map(field => {
        if (searchColumns.indexOf(field) == 0) {
          sqlDataQuery += ` and (${field} ilike :searchValue`;
        } else if (searchColumns.indexOf(field) == (searchColumns.length - 1)) {
          sqlDataQuery += ` or ${field} ilike :searchValue)`;
        } else {
          sqlDataQuery += ` or ${field} ilike :searchValue`;
        }
      });
      replacements = { ...replacements, searchValue: `%${search}%` };
    }

    if (where) {
      if (where.fullName && where.fullName.length) { sqlDataQuery = `${sqlDataQuery} and "full_name" in (:userFullName)`; replacements = { ...replacements, userFullName: where.fullName }; }
      if (where.userName && where.userName.length) { sqlDataQuery = `${sqlDataQuery} and "user_name" in (:userUserName)`; replacements = { ...replacements, userUserName: where.userName }; }
      if (where.email && where.email.length) { sqlDataQuery = `${sqlDataQuery} and email in (:userEmail)`; replacements = { ...replacements, userEmail: where.email }; }
      if (where.verificationStatus && where.verificationStatus.length) { sqlDataQuery = `${sqlDataQuery} and "verification_status" in (:userVerificationStatus)`; replacements = { ...replacements, userVerificationStatus: where.verificationStatus }; }
      if (where.contactNo && where.contactNo.length) { sqlDataQuery = `${sqlDataQuery} and "contact_no" in (:userContactNo)`; replacements = { ...replacements, userContactNo: where.contactNo }; }
      if (where.role && where.role.length) { sqlDataQuery = `${sqlDataQuery} and role in (:userRole)`; replacements = { ...replacements, userRole: where.role }; }
      if (where.isFeatured && where.isFeatured.length) { sqlDataQuery = `${sqlDataQuery} and "is_featured" in (:userIsFeatured)`; replacements = { ...replacements, userIsFeatured: where.isFeatured }; }
      if (where.isActive && where.isActive.length) { sqlDataQuery = `${sqlDataQuery} and "is_active" in (:userIsActive)`; replacements = { ...replacements, userIsActive: where.isActive }; }
      if (where.updatedBy && where.updatedBy.length) { sqlDataQuery = `${sqlDataQuery} and "updated_by" in (:userUpdatedBy)`; replacements = { ...replacements, userUpdatedBy: where.updatedBy }; }
    }

    sqlDataQuery += ' group by id';
    sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as usersCount`;

    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy} limit :limit offset :skip`;
    replacements = {
      ...replacements,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
    };

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    const result = {
      count: parseInt(count[0].count, 10),
      data,
    };
    return result;
  } catch (error) {
    userLogger(`Error from  users : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = users;
