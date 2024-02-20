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
    EventFreelancer: EventFreelancerModel,
  }, Sequelize, sequelize,
} = require('../../sequelize-client');

const freelancerLogger = require('../modules/freelancers/freelancers-logger');

const getFreelancerLeadsService = async (userId, limit, offset = 0, status = 'ACTIVE') => {
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

    const options = {
      limit,
      offset,
      where: condition,
      attributes: ['id', 'name', 'status', 'leadType',
        'startDate', 'endDate', 'location', 'createdAt', 'cancelledBy',
      ],
      include: [
        {
          model: EventFreelancerModel,
          as: 'freelancers',
          where: { userId, isAssigned: true },
        },
        {
          model: UserModel,
          as: 'recruiter',
          attributes: ['id', 'fullName', 'countryCode', 'contactNo'],
        },
        {
          model: UserModel,
          as: 'creator',
          attributes: ['id', 'fullName', 'countryCode', 'contactNo', 'role'],
        },
        {
          model: CityModel,
          as: 'cities',
          attributes: ['id', 'name', 'stateCode', 'countryCode'],
        },
        {
          model: UserModel,
          as: 'cancelledByUser',
          attributes: ['id', 'fullName', 'countryCode', 'contactNo', 'role'],
        },
      ],
      order: [
        [Sequelize.literal('CASE WHEN status = \'ONGOING\' THEN 1 ELSE 0 END'), 'DESC'],
        ['createdAt', 'DESC'],
      ],
    };
    const leads = await EventModel.findAll(options);
    // remove unnecessary attributes
    const response = JSON.parse(JSON.stringify(leads));
    for (const res of response) {
      const { id: eventId } = res;
      const unreadMessagesCountQuery = `(SELECT CAST(count(*) AS INTEGER) FROM chat_messages cm
      LEFT JOIN chat_groups cg ON cg.id = cm.chat_group_id
      LEFT JOIN chat_members cm2 ON cm2.chat_group_id = cg.id
      WHERE cg.ref_id = :eventId and cm2.user_id = :userId
      AND cm.sender_id != :userId AND NOT (:userId = ANY (cm.read_by)))`;
      const replacements = { eventId, userId };
      const messageCount = await sequelize.query(unreadMessagesCountQuery, { replacements, type: Sequelize.QueryTypes.SELECT });

      delete res.freelancers;
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
    freelancerLogger(`Error from get-freelancer-leads: ${error.message}`, null, 'error');
    throw error;
  }
};

module.exports = getFreelancerLeadsService;
