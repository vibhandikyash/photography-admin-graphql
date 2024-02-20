/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const CONFIG = require('../../../config/config');
const { FREELANCER, APPROVED } = require('../../../constants/service-constants');
const { sequelize } = require('../../../sequelize-client');
const { generateS3PublicUrl } = require('../../../shared-lib/aws/functions/generate-get-signed-url');
const freelancerLogger = require('../freelancer-logger');

const sortMapper = {
  id: 'id',
  fullName: 'full_name',
  location: 'primary_location',
  pricePerDay: 'price_per_day',
  ratings: 'average_rating',
};

const listWebFreelancers = async (_, args, ctx) => {
  try {
    let sqlDataQuery;
    const {
      filter: {
        sortOn, sortBy = 'DESC', skip = 0, limit = QUERY_PAGING_MIN_COUNT,
      } = {}, where: {
        freelancerId, freelancerType, category, dateRange: { from: startDate, to: endDate } = {}, isFeatured, location,
        pricePerDay: { min: minAmount, max: maxAmount } = {}, search,
      } = {},
    } = args;

    const replacements = {
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
      userLocation: location,
      isFeatured,
      freelancerType,
      userCategoryName: category,
      freelancerStartDate: startDate,
      freelancerEndDate: endDate,
      userPricePerDayStart: minAmount,
      userPricePerDayEnd: maxAmount,
      role: FREELANCER,
      verificationStatus: APPROVED,
    };

    sqlDataQuery = `SELECT u.id AS id, u.full_name AS "fullName", u.email, u.user_name AS "userName", u.verification_status AS "verificationStatus",
      JSONB_BUILD_OBJECT('pricePerDay',ub.price_per_day,
        'primaryLocation',JSONB_BUILD_OBJECT('id', cp.id, 'name', cp.name, 'stateCode', cp.state_code, 'countryCode', cp.country_code),
        'secondaryLocation', JSONB_BUILD_OBJECT('id', cs.id, 'name', cs.name, 'stateCode', cs.state_code, 'countryCode', cs.country_code),
        'category', JSONB_BUILD_OBJECT('id', c.id, 'name', c.name, 'url', c.url), 'tagLine', ub.tag_line) AS business,
      JSONB_BUILD_OBJECT('averageRating', up.average_rating, 'coverPhoto', up.cover_photo,'profilePhoto', up.profile_photo, 'isFeatured', up.is_featured,'typeKey', up.type_key) AS profile,
      JSONB_AGG(JSON_BUILD_OBJECT('id', b.id, 'name', b.name)) AS "userBadges"
      FROM public.users u
        LEFT JOIN user_businesses ub
        LEFT JOIN categories c ON ub.category_id = c.id AND c.deleted_at IS NULL
        LEFT JOIN cities cp ON cp.id = ub.primary_location AND cp.deleted_at IS NULL
        LEFT JOIN cities cs ON cs.id = ub.secondary_location ON ub.user_id = u.id AND cs.deleted_at IS NULL AND ub.deleted_at IS NULL
        LEFT JOIN user_profiles up
        LEFT JOIN user_types ut ON ut.key = up.type_key ON up.user_id = u.id AND ut.deleted_at IS NULL AND up.deleted_at IS NULL
        LEFT JOIN user_badges ubadge ON u.id = ubadge.user_id AND ubadge.deleted_at IS NULL
        LEFT JOIN badges b ON b.id = ubadge.badge_id AND b.deleted_at IS NULL
      WHERE ((u.role = :role AND u.verification_status = :verificationStatus) AND u.deleted_at IS NULL AND u.account_deleted_at IS NULL)`;
    if (freelancerId) { sqlDataQuery += ` AND (u.id NOT IN ('${freelancerId}'))`; }

    if (search) {
      sqlDataQuery += ' AND (cp.name ILIKE :search or cs.name ILIKE :search)';
      replacements.search = `%${search.trim()}%`;
    }

    if (location) sqlDataQuery = `${sqlDataQuery} AND ub.primary_location = :userLocation `;
    if (typeof isFeatured === 'boolean') sqlDataQuery = `${sqlDataQuery} AND up.is_featured = :isFeatured `;
    if (freelancerType && freelancerType.length) sqlDataQuery = `${sqlDataQuery} AND up."type_key" IN (:freelancerType) `;
    if (category) sqlDataQuery = `${sqlDataQuery} AND c.id IN (:userCategoryName) `;
    if (startDate && endDate) {
      sqlDataQuery = `${sqlDataQuery} AND u.id NOT IN (
        SELECT DISTINCT user_id  FROM freelancer_calenders fc WHERE ((fc.start_date <= :freelancerEndDate AND fc.end_date >= :freelancerStartDate) AND fc.deleted_at IS NULL)
      )`;
    }
    if (minAmount && maxAmount) sqlDataQuery = `${sqlDataQuery} AND ub.price_per_day BETWEEN (:userPricePerDayStart) AND (:userPricePerDayEnd) `;

    sqlDataQuery += ` GROUP BY ub.user_id, u.id, u.full_name, up.is_featured, ub.price_per_day, ub.tag_line, ub.primary_location, ub.secondary_location, up.cover_photo, up.profile_photo, up.type_key, ut.key, ut.level, ut.value,
    u.verification_status, up.average_rating, c."name", cp.id, cs.id, c.id`;

    const sqlCountQuery = `SELECT COUNT(*) FROM (${sqlDataQuery}) AS usersCount`;

    if (sortOn) {
      sqlDataQuery += ` ORDER BY ${sortMapper[sortOn] || 'u.id'} ${sortBy || 'ASC'} NULLS LAST limit :limit offset :skip`;
    } else {
      sqlDataQuery += ` ORDER BY (up.is_featured is false),
      CASE
        WHEN up.type_key = 'WEDLANCER_ASSURED' THEN 1
        WHEN up.type_key = 'PREMIUM' THEN 2
        WHEN up.type_key = 'FREE' THEN 3
      END ASC, ${sortMapper[sortOn] || 'u.id'} ${sortBy || 'ASC'} limit :limit offset :skip`;
    }

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    const count = await sequelize.query(sqlCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });
    for (const dataObj of data) {
      if (dataObj.business) {
        const { business: { category: userCategory = {} } = {} } = dataObj;
        if (userCategory) {
          const url = await generateS3PublicUrl(userCategory.url, CONFIG.AWS.BUCKET.PUBLIC_BUCKET_NAME);
          userCategory.url = url ?? '';
        }
      }
    }
    const result = { count: parseInt(count[0].count, 10), data };
    return result;
  } catch (error) {
    freelancerLogger(`Error from  list-web-freelancer : ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listWebFreelancers;
