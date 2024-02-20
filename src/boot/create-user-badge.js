/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const defaultLogger = require('../logger');

const badges = require('./data/user-badge');

const createUserBadge = async models => {
  try {
    const { Badge: BadgeModel } = models;

    const userBadge = async () => {
      try {
        const userBadges = [];
        for (const badge of badges) {
          const count = await BadgeModel.count({
            where: { name: badge.name },
          });
          if (!count) {
            userBadges.push(badge);
          }
        }
        if (userBadges.length) {
          await BadgeModel.bulkCreate(userBadges);
        }
      } catch (error) {
        defaultLogger(`Error while bulk create userBadge > ${error}`, null, 'error');
        throw error;
      }
    };

    // CREATE USER BADGE
    setTimeout(async () => {
      await userBadge();
    }, 10000);
  } catch (error) {
    defaultLogger(`Error while creating user badges ${error}`, null, 'error');
  }
};

module.exports = createUserBadge;
