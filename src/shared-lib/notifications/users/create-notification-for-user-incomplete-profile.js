/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const moment = require('moment');
const { Op } = require('sequelize');

const { USER_INCOMPLETE_PROFILE: { USER_INCOMPLETE_PROFILE_VALIDATION_IN_HOURS } } = require('../../../config/config');
const {
  NOTIFICATION_TYPES: { PROFILE_COMPLETION_REMINDER }, NOTIFICATION_REF_TYPES: { USER }, USER_ROLE: { FREELANCER, RECRUITER },
  DAYS_VALIDATION_TO_CHECK_USER_INCOMPLETE_PROFILE,
} = require('../../../constants/service-constants');

const defaultLogger = require('../../../logger');
const { Notification: NotificationModel, User: UserModel, UserProfile: UserProfileModel } = require('../../../sequelize-client');
const { getMessage } = require('../../../utils/messages');
const sendPush = require('../send-push');

const createNotificationForUserIncompleteProfile = async () => {
  try {
    const endDate = moment().subtract(USER_INCOMPLETE_PROFILE_VALIDATION_IN_HOURS, 'hours');
    const startDate = moment(endDate).subtract(DAYS_VALIDATION_TO_CHECK_USER_INCOMPLETE_PROFILE, 'days');

    const users = await UserModel.findAll({
      where: { role: [FREELANCER, RECRUITER], createdAt: { [Op.between]: [startDate, endDate] } },
      include: {
        model: UserProfileModel,
        as: 'profile',
        attributes: ['aadharCardFront', 'aadharCardBack', 'userId'],
        where: { [Op.or]: { aadharCardFront: null, aadharCardBack: null } },
      },
    });

    const title = getMessage('PROFILE_COMPLETION_TITLE');
    const message = getMessage('PROFILE_COMPLETION_MESSAGE');

    const notificationDataForUser = [];
    for (const user of users) {
      const { id: userId } = user;
      const pushData = {
        title,
        content: message,
        additionalData: { userId, notificationType: PROFILE_COMPLETION_REMINDER },
        filters: [{
          field: 'tag', key: 'userId', relation: '=', value: userId,
        }],
      };
      const notificationData = {
        title,
        message,
        type: PROFILE_COMPLETION_REMINDER,
        receiverId: userId,
        refId: userId,
        refType: USER,
        refData: user,
        actionRequired: false,
      };
      notificationDataForUser.push(notificationData);
      sendPush(pushData);
    }
    await NotificationModel.bulkCreate(notificationDataForUser);
  } catch (error) {
    defaultLogger(`Error from creating notification for incomplete profile reminder to user : ${error}`, null, 'error');
  }
};

module.exports = createNotificationForUserIncompleteProfile;
