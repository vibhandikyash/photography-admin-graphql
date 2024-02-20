const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const {
  FREELANCER,
} = require('../../../constants/service-constants');

const { sequelize } = require('../../../sequelize-client');
const eventLogger = require('../event-logger');

const sortMapper = {
  fullName: 'u.full_name',
  primaryLocation: 'ub.primary_location',
  secondaryLocation: 'ub.secondary_location',
  category: 'cat.name',
  contactNo: 'u.contact_no',
  pricePerDay: 'ub.price_per_day',
  createdAt: 'u.created_at',
  rating: 'up.average_rating',
};

const getFreelancerAvailabilityList = async (_, args, ctx) => {
  try {
    let sqlDataQuery;
    const {
      filter: {
        sortOn = 'fullName', sortBy = 'DESC', skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      } = {}, where: {
        category, dateRange: { from: startDate = null, to: endDate = null } = {}, primaryLocation, secondaryLocation,
        pricePerDay: { startRange, endRange } = {}, typeKey,
      } = {},
    } = args;
    const replacements = {
      startDate,
      endDate,
      primaryLocation,
      secondaryLocation,
      startRange,
      endRange,
      typeKey,
      category,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
      userRole: FREELANCER,
    };

    sqlDataQuery = `SELECT u.id, u.full_name, u.user_name, up.type_key as "typeKey", u.country_code, u.contact_no,cat."name" AS "category",ub.primary_location,ub.secondary_location, ub.price_per_day,up.average_rating,
    JSONB_AGG(JSON_BUILD_OBJECT('id', fc.id, 'startDate', fc.start_date, 'endDate', fc.end_date)) AS fca,
    (SELECT TO_JSONB(secondaryLocation) AS secondaryLocation FROM ( SELECT c.id,c.name AS "location_name" FROM cities c WHERE c.id = ub.secondary_location) AS secondaryLocation) AS secondary_location_details,
    (SELECT TO_JSONB(primaryLocation) AS primaryLocation FROM (select c.id,c.name as "location_name" from cities c where c.id = ub.primary_location) AS primaryLocation) AS primary_location_details
    FROM users u
      LEFT JOIN "user_businesses" ub ON ub."user_id" = u."id" AND ub.deleted_at is NULL
      LEFT JOIN "user_profiles" up ON up."user_id" = u."id" and up.deleted_at is null
      LEFT JOIN "categories" cat ON cat."id" = ub."category_id" AND cat.deleted_at IS NULL
      LEFT JOIN "freelancer_calenders" fc ON fc."user_id" = u."id" AND fc.deleted_at IS NULL AND (fc.start_date <= :endDate AND fc.end_date >= :startDate)
    WHERE (u.role = :userRole AND u."deleted_at" IS NULL AND u.account_deleted_at IS NULL) AND (fc."deleted_at" IS NULL)`;

    if (search) {
      sqlDataQuery += ' AND (u.full_name ILIKE :search)';
      replacements.search = `%${search.trim()}%`;
    }

    if (startDate && endDate) {
      sqlDataQuery = `${sqlDataQuery} AND (fc.start_date IS NULL OR fc.end_date IS NULL OR fc.start_date >= :endDate AND fc.end_date <= :startDate)`;
    }
    if (primaryLocation && primaryLocation.length) { sqlDataQuery = `${sqlDataQuery} and ub."primary_location" in (:primaryLocation)`; }
    if (secondaryLocation && secondaryLocation.length) { sqlDataQuery = `${sqlDataQuery} and ub."secondary_location" in (:secondaryLocation)`; }
    if (startRange) { sqlDataQuery = `${sqlDataQuery} and ub."price_per_day" >= :startRange `; }
    if (endRange) { sqlDataQuery = `${sqlDataQuery} and ub."price_per_day" <= :endRange `; }
    if (startRange && endRange) { sqlDataQuery = `${sqlDataQuery} and (ub."price_per_day" >= :startRange and ub."price_per_day" <= :endRange )`; }

    if (typeKey && typeKey.length) { sqlDataQuery = `${sqlDataQuery} and up."type_key" in (:typeKey)`; }
    if (category && category.length) { sqlDataQuery = `${sqlDataQuery} and ub."category_id" in (:category)`; }

    sqlDataQuery += ' GROUP BY u.id,cat.id,ub.id,up.id';
    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) AS usersCount`;

    sqlDataQuery += ` ORDER BY ${sortMapper[sortOn]} ${sortBy} LIMIT :limit OFFSET :skip`;

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const result = {
      count: parseInt(count[0].count, 10),
      data,
    };
    return result;
  } catch (error) {
    eventLogger(`Error while getting get freelancer availability list : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getFreelancerAvailabilityList;
