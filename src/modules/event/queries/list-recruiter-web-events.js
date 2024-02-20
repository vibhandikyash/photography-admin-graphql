const moment = require('moment');
const { Op } = require('sequelize');

const { QUERY_PAGING_MIN_COUNT, QUERY_PAGING_MAX_COUNT } = require('../../../config/config');
const { EVENT_LISTING_STATUS: { ACTIVE, PAST } } = require('../../../constants/service-constants');
const { Sequelize } = require('../../../sequelize-client');
const eventsLogger = require('../event-logger');

const listRecruiterWebEvents = async (_, args, ctx) => {
  try {
    const { models: { Event: EventModel }, req: { user: { id: userId } } } = ctx;
    const { filter: { skip: offset = 0 }, where } = args;
    let { filter: { limit = QUERY_PAGING_MIN_COUNT } } = args;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);
    let condition = { recruiterId: userId };
    if (where) {
      const { status, eventDate } = where;
      if (status && status === ACTIVE) {
        condition = { ...condition, endDate: { [Op.gte]: moment() } };
      } else if (status && status === PAST) {
        condition = { ...condition, endDate: { [Op.lt]: moment() } };
      }
      if (eventDate) {
        const { from: startDate, to: endDate } = eventDate;
        condition = {
          ...condition,
          [Op.or]: [
            { startDate: { [Op.between]: [startDate, endDate] } },
            { endDate: { [Op.between]: [startDate, endDate] } },
          ],
        };
      }
    }
    const events = await EventModel.findAll({
      where: condition,
      limit,
      offset,
      attributes: ['id', 'name', 'status', 'leadType', 'startDate', 'endDate', 'location', 'createdAt', 'cancelledBy'],
      order: [
        [Sequelize.literal('CASE WHEN status = \'ONGOING\' THEN 1 ELSE 0 END'), 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    const eventsCount = await EventModel.count({ where: condition });
    const result = { count: eventsCount, data: events };
    return result;
  } catch (error) {
    eventsLogger(`Error from listing recruiter web events: ${error}`, ctx, 'error');
    throw error;
  }
};
module.exports = listRecruiterWebEvents;
