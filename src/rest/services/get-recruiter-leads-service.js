/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { get } = require('lodash');
const moment = require('moment');
const { Op } = require('sequelize');

const {
  models:
  {
    Event: EventModel,
    User: UserModel,
    City: CityModel,
  }, Sequelize,
  sequelize,
} = require('../../sequelize-client');
const recruitersLogger = require('../modules/recruiters/recruiters-logger');

const getEventFreelancersCount = require('./events/get-event-freelancers-count');

const getRecruiterLeadsService = async (userId, limit, offset = 0, status = 'ACTIVE') => {
  try {
    let condition;
    if (status === 'ACTIVE') {
      condition = {
        endDate: {
          [Op.gte]: moment(),
        },
      };
    } else {
      condition = {
        endDate: {
          [Op.lt]: moment(),
        },
      };
    }

    const eventInstance = await EventModel.findAll({
      limit,
      offset,
      where: { recruiterId: userId, ...condition },
      order: [
        [Sequelize.literal('CASE WHEN status = \'ONGOING\' THEN 1 ELSE 0 END'), 'DESC'],
        ['createdAt', 'DESC']],
      attributes: ['id', 'name', 'leadType', 'startDate', 'endDate', 'status', 'createdAt', 'recruiterId'],
      include: [
        {
          model: CityModel,
          as: 'cities',
          attributes: ['id', 'name', 'stateCode', 'countryCode'],
        },
        {
          model: UserModel,
          as: 'creator',
          attributes: ['id', 'fullName', 'role'],
        },
        {
          model: UserModel,
          as: 'cancelledByUser',
          attributes: ['fullName', 'role'],
        },
      ],
    });

    // remove unnecessary attributes
    const response = JSON.parse(JSON.stringify(eventInstance));

    for (const res of response) {
      const { id: eventId } = res;
      // QUERY FOR FETCH UNREAD MESSAGE COUNT
      const unreadMessagesCountQuery = `(SELECT CAST(count(*) AS INTEGER) FROM chat_messages cm LEFT JOIN chat_groups cg ON cg.id = cm.chat_group_id WHERE cg.ref_id = '${eventId}'
      AND cm.sender_id != '${userId}' AND NOT ('${userId}' = ANY (cm.read_by)))`;
      const messageCount = await sequelize.query(unreadMessagesCountQuery, { type: Sequelize.QueryTypes.SELECT });

      const { totalCategoriesCount, totalFreelancerCount } = await getEventFreelancersCount(userId, res.id);
      res.totalCategoriesCount = totalCategoriesCount;
      res.totalFreelancerCount = totalFreelancerCount;
      res.unReadMessageCount = get(messageCount, '[0].count');
      if (res.cancelledByUser?.id === userId) {
        res.cancelledBy = 'YOU';
      } else {
        res.cancelledBy = res.cancelledByUser?.role;
      }
      delete res.cancelledByUser;
    }

    const result = {
      count: response.length,
      data: response,
    };

    return result;
  } catch (error) {
    recruitersLogger(`Error from get-recruiter-leads: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getRecruiterLeadsService;
