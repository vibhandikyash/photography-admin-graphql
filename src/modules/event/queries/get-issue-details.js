/* eslint-disable prefer-const */
const { get, isEmpty } = require('lodash');

const { CustomApolloError } = require('../../../shared-lib/error-handler');
const { getMessage } = require('../../../utils/messages');
const eventLogger = require('../event-logger');

const getIssueDetails = async (_, args, ctx) => {
  try {
    const {
      models: {
        User: UserModel,
        UserBusiness: UserBusinessModel,
        Event: EventModel,
        Category: CategoryModel,
        Dispute: DisputeModel,
        City: CityModel,
      },
      localeService,
    } = ctx;

    const { id } = args;

    let issueInstance = await DisputeModel.findByPk(
      id,
      {
        attributes: ['id', 'status', 'resolution', 'message', 'createdAt'],
        include: [
          {
            model: EventModel,
            as: 'event',
            attributes: ['name', 'location'],
            include: [
              {
                model: CityModel,
                as: 'cities',
                attributes: ['id', 'name'],
              },
            ],
          },
          {
            model: UserModel,
            as: 'creator',
            attributes: ['fullName', 'role', 'contactNo', 'countryCode'],
            include: [
              {
                model: UserBusinessModel,
                as: 'business',
                attributes: ['categoryId'],
                include: [
                  {
                    model: CategoryModel,
                    as: 'userCategory',
                    attributes: ['name'],
                  },
                ],
              },
            ],
          },
          {
            model: UserModel,
            as: 'user',
            attributes: ['fullName', 'role', 'contactNo', 'countryCode'],
            include: [
              {
                model: UserBusinessModel,
                as: 'business',
                attributes: ['categoryId'],
                include: [
                  {
                    model: CategoryModel,
                    as: 'userCategory',
                    attributes: ['name'],
                  },
                ],
              },
            ],
          },
        ],
      },
    );

    if (!issueInstance) {
      throw new CustomApolloError(getMessage('ISSUE_NOT_FOUND', localeService));
    }

    issueInstance = JSON.parse(JSON.stringify(issueInstance));
    if (issueInstance && issueInstance.message) {
      issueInstance.concernRaised = issueInstance.message;
    }

    let { creator, user } = issueInstance;

    if (creator.role === 'RECRUITER') {
      delete issueInstance.creator.business;
    }

    if (issueInstance.creator.business) {
      const { userCategory } = creator.business;
      delete issueInstance.creator.business;
      issueInstance.creator = { ...creator, ...userCategory };
    }

    const eventLocation = get(issueInstance, 'event.cities');
    if (eventLocation && !isEmpty(eventLocation)) {
      issueInstance.event.location = {
        id: eventLocation.id,
        locationName: eventLocation.name,
      };
      delete issueInstance.event.cities;
    }

    if (issueInstance.user.business) {
      const { userCategory } = user.business;
      delete issueInstance.user.business;
      issueInstance.user = { ...user, ...userCategory };
    }

    if (user.role === 'RECRUITER') {
      delete issueInstance.user.business;
    }

    return issueInstance;
  } catch (error) {
    eventLogger(`Error from get issue details: ${error}`, ctx, 'error');
    throw error;
  }
};

module.exports = getIssueDetails;
