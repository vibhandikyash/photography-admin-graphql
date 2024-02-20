/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-const */
const Sequelize = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { sequelize } = require('../../../sequelize-client');
const { getKeysAndGenerateUrl } = require('../../../shared-lib/aws/functions/generate-url-for-keys');

const eventLogger = require('../event-logger');

const listComments = async (_, args, ctx) => {
  try {
    const {
      filter: {
        skip = 0, limit = QUERY_PAGING_MIN_COUNT,
      }, where,
    } = args;
    let replacements = {};
    const { eventId } = where;

    const sqlDataQuery = `select u.id as "userId", u.full_name as "fullName", name as "category", email, up.profile_photo as "profilePhoto" from "users" u
   left join user_profiles up
    on up.user_id  = u.id
   left join user_businesses ub
    on ub.user_id = u.id
   left join categories ct
    on ct.id = ub.category_id
   where u.id in (select distinct user_id from event_freelancers ef where user_id in (select sender_id from "comments" c where event_id in (:eventId))
   or user_id  in (select c.receiver_id from "comments" c where event_id in (:eventId))) limit :limit offset :skip`;

    replacements = {
      eventId,
      limit: parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10),
      skip,
    };
    const data = await sequelize.query(sqlDataQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

    data.forEach(async obj => {
      if (obj.profilePhoto) {
        [obj.profilePhoto] = await getKeysAndGenerateUrl([obj.profilePhoto]);
      }
    });

    const result = {
      comments: data,
    };
    return result;
  } catch (error) {
    eventLogger(`Error from list-comments: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = listComments;
