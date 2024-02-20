/* eslint-disable max-lines */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable array-callback-return */
/* eslint-disable security/detect-object-injection */
const { validationResult } = require('express-validator');
const moment = require('moment');
const Sequelize = require('sequelize');
const { validate } = require('uuid');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../../../config/config');
const { sequelize } = require('../../../../../sequelize-client');

const { getKeysAndGenerateUrl } = require('../../../../../shared-lib/aws/functions/generate-url-for-keys');
const { sendSuccessResponse, getValidatorFirstMsg } = require('../../../../../utils/create-error');
const { ApiError } = require('../../../../services/custom-api-error');
const { VALIDATION_FAILED } = require('../../../../services/http-status-codes');
const freelancersLogger = require('../../freelancers-logger');

const sortMapper = {
  id: 'id',
  fullName: 'full_name',
  location: 'primary_location',
  pricePerDay: 'price_per_day',
  ratings: 'average_rating',
};

const listFreelancers = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const extractedError = await getValidatorFirstMsg(errors); // Return only first error message
      throw new ApiError(extractedError, VALIDATION_FAILED);
    }

    let sqlDataQuery;
    let {
      sortOn, sortBy, skip = 0, limit = QUERY_PAGING_MIN_COUNT, search,
      location, category, startRange, endRange, exceptId, startDate, endDate,
    } = req.query;
    const replacements = {
      userPricePerDayStart: startRange,
      userPricePerDayEnd: endRange,
      userLocation: location,
      freelancerStartDate: startDate,
      freelancerEndDate: endDate,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
      userCategoryName: category,
    };

    sqlDataQuery = `select
      u.id as id,
      u.full_name as "fullName",
      u.verification_status as "verificationStatus",
      JSONB_BUILD_OBJECT(
      'pricePerDay',ub.price_per_day,
      'userPrimaryLocation', JSONB_BUILD_OBJECT(
        'id', cp.id,
        'name', cp.name,
        'stateCode', cp.state_code,
        'countryCode', cp.country_code
      ),
      'userSecondaryLocation', JSONB_BUILD_OBJECT(
        'id', cs.id,
        'name', cs.name,
        'stateCode', cs.state_code,
        'countryCode', cs.country_code
      ),
      'tagLine', ub.tag_line) as business,
      JSONB_BUILD_OBJECT(
      'averageRating', up.average_rating,
      'coverPhoto', up.cover_photo,
      'profilePhoto', up.profile_photo,
      'isFeatured', up.is_featured,
      'typeKey', up.type_key) as profile,
      jsonb_agg(b.name) as "badges",
      c."name" as "category"
    from
    public.users u
    left join user_businesses ub
    left join categories c on
    ub.category_id = c.id and c.deleted_at is null
    left join cities cp on cp.id = ub.primary_location and cp.deleted_at is null
    left join cities cs on cs.id = ub.secondary_location on ub.user_id = u.id and cs.deleted_at is null and ub.deleted_at is null
    left join user_profiles up
    left join user_types ut on
      ut.key = up.type_key on
      up.user_id = u.id and ut.deleted_at is null and up.deleted_at is null
    left join user_badges ubadge on
      u.id = ubadge.user_id AND ubadge.deleted_at is null
    left join badges b on
      b.id = ubadge.badge_id AND b.deleted_at is null
      where
      ((u.role = 'FREELANCER' and u.verification_status = 'APPROVED') and u.deleted_at is null and u.account_deleted_at is null)`;

    if (exceptId && validate(exceptId)) { sqlDataQuery += ` and (u.id not in ('${exceptId}'))`; }

    if (search) {
      sqlDataQuery += ' AND (cp.name ILIKE :search or cs.name ILIKE :search)';
      replacements.search = `%${search.trim()}%`;
    }

    if (location) sqlDataQuery = `${sqlDataQuery} and ub.primary_location = :userLocation`;
    if (category) { sqlDataQuery = `${sqlDataQuery} and c.name in (:userCategoryName)`; }
    if (startRange && endRange) { sqlDataQuery = `${sqlDataQuery} and ub.price_per_day between (:userPricePerDayStart) and (:userPricePerDayEnd)`; }
    if (startDate && endDate) {
      startDate = moment(startDate).toISOString();
      endDate = moment(endDate).toISOString();
      sqlDataQuery = `${sqlDataQuery} and u.id not in (
      select distinct user_id  from freelancer_calenders fc where ((fc.start_date <= :freelancerEndDate AND fc.end_date >= :freelancerStartDate) and fc.deleted_at is null)
      )`;
    }

    sqlDataQuery += ` group by ub.user_id,
    u.id,
    u.full_name,
    up.is_featured,
    ub.price_per_day,
    ub.tag_line,
    ub.primary_location,
    ub.secondary_location,
    up.cover_photo,
    up.profile_photo,
    up.type_key,
    ut.key,
    ut.level,
    ut.value,
    u.verification_status,
    up.average_rating,
    c."name",
    cp.id,
    cs.id,
    c.id
    `;

    if (sortOn) {
      sqlDataQuery += ` ORDER BY ${sortMapper[sortOn] || 'u.id'} ${sortBy || 'ASC'} NULLS LAST
    limit :limit offset :skip`;
    } else {
      sqlDataQuery += ` ORDER BY (up.is_featured is false),
      CASE
        WHEN up.type_key = 'WEDLANCER_ASSURED' THEN 1
        WHEN up.type_key = 'PREMIUM' THEN 2
        WHEN up.type_key = 'FREE' THEN 3
      END ASC,${sortMapper[sortOn] || 'u.id'} ${sortBy || 'ASC'} limit :limit offset :skip`;
    }

    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    for (let freelancer of data) {
      if (freelancer.profile.profilePhoto !== null) {
        [freelancer.profile.profilePhoto] = await getKeysAndGenerateUrl([freelancer.profile.profilePhoto]);
      }
      if (freelancer.profile.coverPhoto !== null) {
        [freelancer.profile.coverPhoto] = await getKeysAndGenerateUrl([freelancer.profile.coverPhoto]);
      }
    }
    const result = {
      count: data.length,
      data,
    };

    return sendSuccessResponse(res, 'SUCCESS', 200, result);
  } catch (error) {
    freelancersLogger(`Error from list-freelancers: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = listFreelancers;
