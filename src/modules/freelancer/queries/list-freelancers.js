const { isBoolean } = require('lodash');
const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');

const { sequelize } = require('../../../sequelize-client');
const freelancerLogger = require('../freelancer-logger');

const sortMapper = {
  id: 'id',
  fullName: 'full_name',
  userName: 'user_name',
  email: 'email',
  verificationStatus: 'verification_status',
  categoryName: 'category_name',
  location: 'primary_location',
  pricePerDay: 'price_per_day',
  contactNo: 'contact_no',
  isActive: 'is_active',
  typeKey: 'type_key',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  updatedBy: 'updated_by',
};

const searchColumns = [
  'c.name',
  'u.full_name',
  'u.user_name',
  'u.email',
  'u.contact_no',
  'cast(ub.price_per_day as varchar)',
  'up.type_key',
];

const listFreelancers = async (_, args, ctx) => {
  try {
    let sqlDataQuery;
    const {
      filter: {
        sortOn = 'id', sortBy = 'DESC', skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      } = {}, where: {
        verificationStatus, isActive, categoryName, location, pricePerDay, typeKey, isDeleted,
      } = {},
    } = args;
    const replacements = {
      userVerificationStatus: verificationStatus,
      userIsActive: isActive,
      userCategoryName: categoryName,
      userLocation: location,
      userPricePerDay: pricePerDay,
      userTypeKey: typeKey,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
      isDeleted,
    };
    sqlDataQuery = `select
     u.id,u.full_name,u.user_name,u.email,u.verification_status,
     u.contact_no,u.country_code,u."role",u.is_active,u.updated_by,u.created_by,
     u.created_at,u.updated_at,ub.primary_location,ub.price_per_day,up.type_key,up.aadhar_card_front,up.aadhar_card_back,
     up.is_featured,
     c."name" as "category_name",
     (
      select
        jsonb_agg(user_badge_obj)
      from
        (
        select b.id,b."name"
        from
          user_badges ub2
        left join badges b on
          b.id = ub2.badge_id
        where
          ub2.user_id = u.id and ub2.deleted_at is null
       ) as user_badge_obj
      ) as user_badge
    from
      users u
    left join (user_businesses ub
    left join categories c on
      ub.category_id = c.id)
          on
      ub.user_id = u.id
    left join user_profiles up
          on
      up.user_id = u.id
    where
      ((u.role = 'FREELANCER')
        and u.deleted_at is null)`;

    if (search) {
      searchColumns.forEach(field => {
        if (searchColumns.indexOf(field) === 0) {
          sqlDataQuery += ` and (${field} iLike :searchValue`;
        } else if (searchColumns.indexOf(field) === (searchColumns.length - 1)) {
          sqlDataQuery += ` or ${field} iLike :searchValue)`;
        } else {
          sqlDataQuery += ` or ${field} iLike :searchValue`;
        }
      });
      replacements.searchValue = `%${search}%`;
    }

    if (verificationStatus && verificationStatus.length) { sqlDataQuery = `${sqlDataQuery} AND u.verification_status IN (:userVerificationStatus)`; }
    if (isActive && isActive.length) { sqlDataQuery = `${sqlDataQuery} AND u.is_active IN (:userIsActive)`; }
    if (categoryName && categoryName.length) { sqlDataQuery = `${sqlDataQuery} AND c.id IN (:userCategoryName)`; }
    if (location && location.length) { sqlDataQuery = `${sqlDataQuery} AND ub.primary_location IN (:userLocation)`; }
    if (pricePerDay && pricePerDay.length) { sqlDataQuery = `${sqlDataQuery} AND ub.price_per_day IN (:userPricePerDay)`; }
    if (typeKey && typeKey.length) { sqlDataQuery = `${sqlDataQuery} AND up.type_key IN (:userTypeKey)`; }
    if (isBoolean(isDeleted)) {
      sqlDataQuery = `${sqlDataQuery} AND u.account_deleted_at ${isDeleted ? 'is not' : 'is'} null`;
    }

    sqlDataQuery += ' GROUP BY u.id, ub.id,up.id, c.id';

    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) as usersCount`;

    // eslint-disable-next-line security/detect-object-injection
    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy} LIMIT :limit OFFSET :skip`;

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const result = {
      count: parseInt(count[0].count, 10),
      data,
    };
    return result;
  } catch (error) {
    freelancerLogger(`Error from  list-freelancer : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listFreelancers;
