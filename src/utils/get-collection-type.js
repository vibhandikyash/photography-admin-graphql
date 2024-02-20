/* eslint-disable consistent-return */
const { includes } = require('lodash');

const defaultLogger = require('../logger');

const { models } = require('../sequelize-client');
const { CustomApolloError } = require('../shared-lib/error-handler');

const { getMessage } = require('./messages');

const PHOTOGRAPHER = ['PHOTOGRAPHER', 'TRADITIONAL PHOTOGRAPHER', 'PHOTO EDITOR', 'CAMERA AND PHOTO GOODS', 'ALBUM DESIGNING AND PRINTING'];
const VIDEOGRAPHER = ['CINEMATOGRAPHER', 'VIDEO EDITOR', 'AERIAL CINEMATOGRAPHER', 'TRADITIONAL VIDEOGRAPHER', 'RENT- LED DISPLAY'];

const getCollectionTypeOfUser = async userId => {
  try {
    let type;
    const {
      Category: CategoryModel,
      UserBusiness: UserBusinessModel,
    } = models;

    const getUserCategory = await UserBusinessModel.findOne({
      where: {
        userId,
      },
      include: [{
        model: CategoryModel,
        as: 'userCategory',
        attributes: ['name'],
      }],
    });

    if (!getUserCategory) {
      throw new CustomApolloError(getMessage('PORTFOLIO_NOT_FOUND'));
    }

    const { userCategory } = getUserCategory;
    if (!userCategory) {
      throw new CustomApolloError(getMessage('INCOMPLETE_PROFILE'));
    }
    if (includes(PHOTOGRAPHER, userCategory.name)) {
      type = 'IMAGE';
    }

    if (includes(VIDEOGRAPHER, userCategory.name)) {
      type = 'VIDEO';
    }
    return type;
  } catch (error) {
    defaultLogger(`Error while get collection type of user :${error}`, null, 'error');
    throw error;
  }
};

module.exports = getCollectionTypeOfUser;
